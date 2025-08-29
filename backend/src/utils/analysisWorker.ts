import { Worker } from 'bullmq';
import { redisConnection } from './queue';
import winston from 'winston';
import { db } from '../db/client';
import { pages, contentAnalysis } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AnalysisService } from './analysisService';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

async function analyzePage(pageId: string) {
  const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  const page = pageArr[0];
  if (!page) throw new Error(`Page ${pageId} not found`);

  logger.info(`🔍 Starting comprehensive analysis for page ${pageId} (${page.url})...`);
  
  try {
    // Use the new AnalysisService for comprehensive analysis
    const analysisResult = await AnalysisService.analyzePage({
      url: page.url,
      contentSnapshot: page.contentSnapshot || undefined
    });

    // Save/update the page with original content snapshot and summary
    await db.update(pages)
      .set({
        contentSnapshot: JSON.stringify(analysisResult.content),
        title: analysisResult.content.title || page.title, // Update title if found
        llmReadinessScore: analysisResult.score,
        lastAnalysisAt: new Date(),
        lastScannedAt: new Date()
      })
      .where(eq(pages.id, pageId));

    // Store analysis results in database (normalized structure)
    const analysisResultRecord = await db.insert(contentAnalysis).values({
      pageId,
      overallScore: analysisResult.score,
      llmModelUsed: 'gpt-4o-mini',
      pageSummary: analysisResult.pageSummary,
      analysisSummary: analysisResult.summary,
      
      // Content quality metrics
      contentClarity: analysisResult.contentQuality?.clarity || 0,
      contentStructure: analysisResult.contentQuality?.structure || 0,
      contentCompleteness: analysisResult.contentQuality?.completeness || 0,
      
      // Technical SEO metrics
      titleOptimization: analysisResult.technicalSEO?.titleOptimization || 0,
      metaDescription: analysisResult.technicalSEO?.metaDescription || 0,
      headingStructure: analysisResult.technicalSEO?.headingStructure || 0,
      schemaMarkup: analysisResult.technicalSEO?.schemaMarkup || 0,
      
      // Keyword analysis
      primaryKeywords: analysisResult.keywordAnalysis?.primaryKeywords || [],
      longTailKeywords: analysisResult.keywordAnalysis?.longTailKeywords || [],
      keywordDensity: analysisResult.keywordAnalysis?.keywordDensity || 0,
      semanticKeywords: analysisResult.keywordAnalysis?.semanticKeywords || [],
      
      // LLM optimization metrics
      definitionsPresent: analysisResult.llmOptimization?.definitionsPresent ? 1 : 0,
      faqsPresent: analysisResult.llmOptimization?.faqsPresent ? 1 : 0,
      structuredData: analysisResult.llmOptimization?.structuredData ? 1 : 0,
      citationFriendly: analysisResult.llmOptimization?.citationFriendly ? 1 : 0,
      topicCoverage: analysisResult.llmOptimization?.topicCoverage || 0,
      answerableQuestions: analysisResult.llmOptimization?.answerableQuestions || 0,
      
      confidence: 0.8, // Default confidence
      analysisVersion: '2.0'
    }).returning();

    const analysisResultId = analysisResultRecord[0].id;

    logger.info(`✅ Analysis completed for page ${pageId} - Score: ${analysisResult.score}/100`);
    logger.info(`📝 Saved original content and AI summary for page ${pageId}`);

    // Generate AI-powered recommendations
    try {
      const aiRecommendations = await AnalysisService.generateAIRecommendations(
        analysisResult.content,
        analysisResult,
        analysisResult.pageSummary || ''
      );

      // Save AI recommendations to database
      await AnalysisService.saveAIRecommendations(pageId, analysisResultId, aiRecommendations);
      logger.info(`🤖 Generated and saved AI recommendations for page ${pageId}`);
    } catch (aiError) {
      logger.error(`❌ Failed to generate AI recommendations for page ${pageId}:`, aiError);
      // Don't fail the analysis if AI recommendations fail
    }

    // Auto-generate content suggestions after analysis (using the extracted content)
    try {
      await AnalysisService.autoGenerateContentSuggestions(pageId, analysisResult.content, analysisResult);
      logger.info(`🤖 Auto-generated content suggestions for page ${pageId}`);
    } catch (contentError) {
      logger.error(`❌ Failed to auto-generate content for page ${pageId}:`, contentError);
      // Don't fail the analysis if content generation fails
    }

  } catch (error) {
    logger.error(`❌ Analysis failed for page ${pageId}:`, error);
    throw error;
  }
}

const analysisWorker = new Worker('analysis', async (job) => {
  logger.info(`Processing analysis job: ${JSON.stringify(job.data)}`);
  if (job.name === 'site-analysis') {
    // Analyze all pages for the site
    const { siteId } = job.data;
    const sitePages = await db.select().from(pages).where(eq(pages.siteId, siteId));
    for (const page of sitePages) {
      await analyzePage(page.id);
    }
    logger.info(`Completed analysis for all pages in site ${siteId}`);
    return { status: 'done', analyzed: sitePages.length };
  } else if (job.name === 'page-analysis') {
    const { pageId } = job.data;
    await analyzePage(pageId);
    logger.info(`Completed analysis for page ${pageId}`);
    return { status: 'done', analyzed: 1 };
  }
  return { status: 'skipped' };
}, { connection: redisConnection });

analysisWorker.on('completed', (job) => {
  logger.info(`Analysis job ${job.id} completed.`);
});

analysisWorker.on('failed', (job, err) => {
  logger.error(`Analysis job ${job?.id} failed: ${err}`);
});

// Log when worker starts
logger.info('🔄 Analysis worker started and ready to process jobs'); 