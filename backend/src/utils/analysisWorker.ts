import { Worker } from 'bullmq';
import { redisConnection } from './queue';
import winston from 'winston';
import { db } from '../db/client';
import { pages, contentAnalysis, contentSuggestions, contentRecommendations } from '../db/schema';
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

/**
 * Clean up all existing analysis data for a page to prevent duplicates
 */
async function cleanupExistingAnalysisData(pageId: string): Promise<void> {
  try {
    console.log(`🧹 Starting cleanup for page ${pageId}...`);

    // 1. Get all existing content analysis IDs for this page
    const existingAnalysis = await db.select({ id: contentAnalysis.id })
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, pageId));

    console.log(`📊 Found ${existingAnalysis.length} existing analysis records`);

    // 2. Delete content recommendations (dependent on content analysis)
    if (existingAnalysis.length > 0) {
      for (const analysis of existingAnalysis) {
        await db.delete(contentRecommendations)
          .where(eq(contentRecommendations.analysisResultId, analysis.id));
      }
      console.log(`🗑️ Deleted content recommendations for ${existingAnalysis.length} analysis records`);
    }

    // 3. Delete content suggestions (independent)
    const deletedSuggestions = await db.delete(contentSuggestions)
      .where(eq(contentSuggestions.pageId, pageId));
    console.log(`🗑️ Deleted content suggestions for page ${pageId}`);

    // 4. Delete content analysis records (main analysis data)
    if (existingAnalysis.length > 0) {
      const deletedAnalysis = await db.delete(contentAnalysis)
        .where(eq(contentAnalysis.pageId, pageId));
      console.log(`🗑️ Deleted ${existingAnalysis.length} content analysis records`);
    }

    console.log(`✅ Cleanup completed - page ${pageId} is ready for fresh analysis`);
  } catch (error) {
    console.error(`❌ Cleanup failed for page ${pageId}:`, error);
    // Don't throw error - allow analysis to continue even if cleanup fails
    logger.warn(`⚠️ Cleanup failed but continuing with analysis for page ${pageId}`);
  }
}

async function analyzePage(pageId: string) {
  const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  const page = pageArr[0];
  if (!page) throw new Error(`Page ${pageId} not found`);

  logger.info(`🔍 Starting comprehensive analysis for page ${pageId} (${page.url})...`);
  
  try {
    // **CLEANUP: Remove all existing analysis data to prevent duplicates**
    console.log('🧹 Cleaning up existing analysis data to prevent duplicates...');
    await cleanupExistingAnalysisData(pageId);
    console.log('✅ Cleanup completed successfully');

    // Use the new AnalysisService for comprehensive analysis
    console.log('🔍 About to call AnalysisService.analyzePage...');
    const analysisResult = await AnalysisService.analyzePage({
      url: page.url
    });
    console.log('✅ AnalysisService.analyzePage completed successfully');

    // Save/update the page with original content snapshot and summary
    console.log('💾 About to update page record...');
    await db.update(pages)
      .set({
        contentSnapshot: JSON.stringify(analysisResult.content),
        title: analysisResult.content.title || page.title, // Update title if found
        llmReadinessScore: analysisResult.score,
        lastAnalysisAt: new Date(),
        lastScannedAt: new Date()
      })
      .where(eq(pages.id, pageId));
    console.log('✅ Page record updated successfully');

    // Store analysis results in database (normalized structure)
    console.log('💾 About to save analysis results to database...');
    let analysisResultId: string;
    try {
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

      console.log('✅ Database insert completed successfully');
      analysisResultId = analysisResultRecord[0].id;
    } catch (dbError) {
      console.error('❌ Database insert failed:', dbError);
      throw dbError;
    }

    console.log('✅ Analysis result saved to database');
    console.log('✅ Analysis result ID:', analysisResultId);
    console.log('✅ Analysis completed successfully');

    logger.info(`✅ Analysis completed for page ${pageId} - Score: ${analysisResult.score}/100`);
    logger.info(`📝 Saved original content and AI summary for page ${pageId}`);

    console.log('🔍 About to enter AI recommendation generation block...');
    console.log('🔍 Analysis result ID:', analysisResultId);
    console.log('🔍 Analysis result score:', analysisResult.score);

    // Generate AI-powered recommendations
    console.log('🚀 About to start AI recommendation generation...');
    try {
      console.log('🤖 Starting AI recommendation generation...');
      console.log('📄 Page content for AI analysis:', {
        url: analysisResult.content.url,
        title: analysisResult.content.title,
        titleLength: analysisResult.content.title?.length || 0,
        metaDescription: analysisResult.content.metaDescription?.substring(0, 100) + '...',
        metaLength: analysisResult.content.metaDescription?.length || 0,
        contentLength: analysisResult.content.bodyText?.length || 0,
        headings: analysisResult.content.headings?.length || 0,
        keywords: analysisResult.keywordAnalysis?.primaryKeywords || []
      });
      
      console.log('🔧 Calling AnalysisService.generateAIRecommendations...');
      const aiRecommendations = await AnalysisService.generateAIRecommendations(
        analysisResult.content,
        analysisResult,
        analysisResult.pageSummary || ''
      );

      console.log('💾 Saving AI recommendations to database...');
      // Save AI recommendations to database
      await AnalysisService.saveAIRecommendations(pageId, analysisResultId, aiRecommendations);
      logger.info(`🤖 Generated and saved AI recommendations for page ${pageId}`);
      console.log('✅ AI recommendations saved successfully');
    } catch (aiError) {
      console.error('❌ AI recommendation generation failed:', aiError);
      console.error('❌ Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
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
  if (job.name === 'page-analysis') {
    const { pageId } = job.data;
    await analyzePage(pageId);
    logger.info(`Completed analysis for page ${pageId}`);
    return { status: 'done', analyzed: 1 };
  }
  logger.warn(`Unknown job type: ${job.name}`);
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

// Export the analyzePage function for direct use
export { analyzePage }; 