import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, contentAnalysis, contentRecommendations, contentRatings } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { AnalysisService } from '../utils/analysisService';
import { EnhancedRatingService } from '../utils/enhancedRatingService';
import { ScoreUpdateService } from '../services/scoreUpdateService';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { 
  PageAnalysisSchema,
  BulkAnalysisSchema,
  UUIDSchema,
  PaginationQuerySchema 
} from '../types/dtos';

export class AnalysisController extends BaseController {
  /**
   * Get analysis results for a specific page
   */
  public getPageAnalysis = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Check page ownership
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    
    if (!page) {
      return this.sendError(res, 'Page not found', 404);
    }

    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Not authorized', 403);
    }

    // Get latest analysis
    const analysisArr = await db
      .select()
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(1);

    const analysis = analysisArr[0];
    if (!analysis) {
      return this.sendError(res, 'No analysis found for this page', 404);
    }

    // Get section ratings
    const ratings = await db
      .select()
      .from(contentRatings)
      .where(eq(contentRatings.analysisResultId, analysis.id));

    // Get recommendations
    const recommendations = await db
      .select()
      .from(contentRecommendations)
      .where(eq(contentRecommendations.analysisResultId, analysis.id));

    this.sendSuccess(res, {
      analysis,
      ratings,
      recommendations
    });
  });

  /**
   * Get analysis history for a page
   */
  public getPageAnalysisHistory = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Validate query parameters
    const queryValidation = this.validateQuery(PaginationQuerySchema, req.query);
    if (!queryValidation.isValid) {
      return this.sendError(res, 'Invalid query parameters', 400, queryValidation.errors);
    }

    const queryData = queryValidation.data!;
    const page = queryData.page!; // Safe because schema has default
    const limit = queryData.limit!; // Safe because schema has default
    const offset = (page - 1) * limit;

    // Check page ownership
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const pageRecord = pageArr[0];
    
    if (!pageRecord) {
      return this.sendError(res, 'Page not found', 404);
    }

    const siteArr = await db.select().from(sites).where(eq(sites.id, pageRecord.siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Not authorized', 403);
    }

    // Get analysis history
    const analysisHistory = await db
      .select()
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, pageId));

    this.sendSuccess(res, {
      history: analysisHistory,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  });

  /**
   * Trigger analysis for a specific page
   */
  public triggerPageAnalysis = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(PageAnalysisSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const { forceRefresh } = bodyValidation.data!;

    // Check page ownership
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    
    if (!page) {
      return this.sendError(res, 'Page not found', 404);
    }

    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Not authorized', 403);
    }

    try {
      console.log(`🚀 Starting analysis for page: ${page.url}`);

      // Perform the actual analysis
      const analysisResult = await AnalysisService.analyzePage({
        url: page.url
      }) as any;

      // Calculate section-based score if section ratings are available
      let finalScore = analysisResult.score;
      if (analysisResult.sectionRatings) {
        const sectionBasedScore = EnhancedRatingService.calculateTotalScore(analysisResult.sectionRatings);
        console.log(`📊 Section-based score: ${sectionBasedScore}% (from 7 sections), AI analysis score: ${analysisResult.score}%`);
        finalScore = sectionBasedScore;
      }

      // Update the page with analysis results
      await db.update(pages)
        .set({ 
          contentSnapshot: JSON.stringify(analysisResult.content),
          title: analysisResult.content.title || page.title,
          llmReadinessScore: finalScore,
          pageScore: finalScore,
          lastScoreUpdate: new Date(),
          lastAnalysisAt: new Date(),
          lastScannedAt: new Date()
        })
        .where(eq(pages.id, pageId));

      // Update site metrics
      console.log(`🔄 Updating site metrics after page analysis...`);
      await ScoreUpdateService.updateSiteMetrics(page.siteId);

      // Store analysis results in database
      let analysisResultId: string;
      try {
        const [analysisRecord] = await db.insert(contentAnalysis).values({
          pageId: pageId,
          overallScore: finalScore,
          llmModelUsed: 'gpt-4',
          pageSummary: analysisResult.pageSummary || '',
          analysisSummary: analysisResult.summary || '',
          contentClarity: analysisResult.contentQuality?.clarity || 0,
          contentStructure: analysisResult.contentQuality?.structure || 0,
          contentCompleteness: analysisResult.contentQuality?.completeness || 0,
          titleOptimization: analysisResult.technicalSEO?.titleOptimization || 0,
          metaDescription: analysisResult.technicalSEO?.metaDescription || 0,
          headingStructure: analysisResult.technicalSEO?.headingStructure || 0,
          schemaMarkup: analysisResult.technicalSEO?.schemaMarkup || 0,
          primaryKeywords: analysisResult.keywordAnalysis?.primaryKeywords || [],
          longTailKeywords: analysisResult.keywordAnalysis?.longTailKeywords || [],
          keywordDensity: analysisResult.keywordAnalysis?.keywordDensity || 0,
          semanticKeywords: analysisResult.keywordAnalysis?.semanticKeywords || [],
          definitionsPresent: analysisResult.llmOptimization?.definitionsPresent ? 1 : 0,
          faqsPresent: analysisResult.llmOptimization?.faqsPresent ? 1 : 0,
          structuredData: analysisResult.llmOptimization?.structuredData ? 1 : 0,
          citationFriendly: analysisResult.llmOptimization?.citationFriendly ? 1 : 0,
          topicCoverage: analysisResult.llmOptimization?.topicCoverage || 0,
          answerableQuestions: analysisResult.llmOptimization?.answerableQuestions || 0
        }).returning();
        
        analysisResultId = analysisRecord.id;
        console.log(`✅ Analysis results saved with ID: ${analysisResultId}`);
      } catch (error) {
        console.error('❌ Failed to save analysis results:', error);
        throw error;
      }

      // Generate AI recommendations if available
      if (analysisResult.aiRecommendations) {
        try {
          await EnhancedRatingService.saveSectionRecommendations(
            pageId,
            analysisResultId,
            analysisResult.aiRecommendations
          );
          console.log('✅ AI recommendations saved successfully');
        } catch (error) {
          console.error('❌ Failed to save AI recommendations:', error);
        }
      }

      this.sendSuccess(res, {
        pageId,
        score: finalScore,
        analysisId: analysisResultId,
        message: 'Analysis completed successfully'
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      return this.sendError(res, 'Analysis failed', 500);
    }
  });

  /**
   * Get recommendations for a specific section
   */
  public getSectionRecommendations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;
    const sectionType = req.params.sectionType;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Check page ownership
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    
    if (!page) {
      return this.sendError(res, 'Page not found', 404);
    }

    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Not authorized', 403);
    }

    try {
      const recommendations = await EnhancedRatingService.getSectionRecommendations(pageId, sectionType);
      
      this.sendSuccess(res, {
        pageId,
        sectionType,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching section recommendations:', error);
      return this.sendError(res, 'Failed to fetch recommendations', 500);
    }
  });

  /**
   * Get overall analysis statistics for a site
   */
  public getSiteAnalysisStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Check site ownership
    const siteArr = await db.select().from(sites).where(and(eq(sites.id, siteId), eq(sites.userId, userId))).limit(1);
    const site = siteArr[0];
    
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    try {
      // Get analysis statistics
      const [stats] = await db
        .select({
          totalPages: sql<number>`count(*)`,
          analyzedPages: sql<number>`count(*) filter (where ${pages.lastAnalysisAt} is not null)`,
          averageScore: sql<number>`avg(${pages.pageScore})`,
          highScorePages: sql<number>`count(*) filter (where ${pages.pageScore} >= 80)`,
          mediumScorePages: sql<number>`count(*) filter (where ${pages.pageScore} >= 60 and ${pages.pageScore} < 80)`,
          lowScorePages: sql<number>`count(*) filter (where ${pages.pageScore} < 60 and ${pages.pageScore} is not null)`
        })
        .from(pages)
        .where(eq(pages.siteId, siteId));

      // Get recent analysis activity
      const recentAnalysis = await db
        .select({
          pageId: pages.id,
          pageUrl: pages.url,
          pageTitle: pages.title,
          score: pages.pageScore,
          analyzedAt: pages.lastAnalysisAt
        })
        .from(pages)
        .where(and(eq(pages.siteId, siteId), sql`${pages.lastAnalysisAt} is not null`))
        .orderBy(desc(pages.lastAnalysisAt))
        .limit(10);

      this.sendSuccess(res, {
        siteId,
        siteName: site.name,
        siteUrl: site.url,
        stats,
        recentAnalysis
      });
    } catch (error) {
      console.error('Error fetching analysis stats:', error);
      return this.sendError(res, 'Failed to fetch analysis statistics', 500);
    }
  });
}
