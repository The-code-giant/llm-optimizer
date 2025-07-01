import { Worker } from 'bullmq';
import { redisConnection } from './queue';
import winston from 'winston';
import { db } from '../db/client';
import { pages, analysisResults } from '../db/schema';
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

    // Store analysis results in database (using existing schema fields)
    await db.insert(analysisResults).values({
      pageId,
      score: analysisResult.score,
      recommendations: JSON.stringify({
        recommendations: analysisResult.recommendations,
        issues: analysisResult.issues,
        summary: analysisResult.summary,
        contentQuality: analysisResult.contentQuality,
        technicalSEO: analysisResult.technicalSEO,
        keywordAnalysis: analysisResult.keywordAnalysis,
        llmOptimization: analysisResult.llmOptimization
      }),
      llmModelUsed: 'gpt-4o-mini',
      rawLlmOutput: JSON.stringify(analysisResult),
      analyzedAt: new Date()
    });

    logger.info(`✅ Analysis completed for page ${pageId} - Score: ${analysisResult.score}/100`);

    // Auto-generate content suggestions after analysis
    try {
      // We need to get the page content for auto-generation
      const content = await AnalysisService.fetchPageContent(page.url);
      await AnalysisService.autoGenerateContentSuggestions(pageId, content, analysisResult);
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