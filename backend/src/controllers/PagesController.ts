import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, contentAnalysis, contentSuggestions, pageAnalytics, contentRatings, contentRecommendations, contentDeployments } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { AnalysisService } from '../utils/analysisService';
import { EnhancedRatingService } from '../utils/enhancedRatingService';
import { ScoreUpdateService } from '../services/scoreUpdateService';
import cache from '../utils/cache';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { 
  PageAnalysisSchema, 
  PageContentSchema, 
  SectionContentSchema,
  UUIDSchema,
  PaginationQuerySchema 
} from '../types/dtos';

export class PagesController extends BaseController {
  /**
   * Get page details
   */
  public getPage = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    
    if (!page) {
      return this.sendError(res, 'Page not found', 404);
    }

    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Not authorized', 403);
    }

    this.sendSuccess(res, page);
  });

  /**
   * Get latest analysis result for a page
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

    // Get recommendations for this analysis
    const recommendationsArr = await db
      .select()
      .from(contentRecommendations)
      .where(eq(contentRecommendations.analysisResultId, analysis.id));

    // Use the page's actual score from the pages table (this is what was working before)
    const pageScore = page.pageScore || page.llmReadinessScore || 0;

    // Construct the AnalysisResult object that the frontend expects
    const analysisResult = {
      id: analysis.id,
      pageId: analysis.pageId,
      summary: analysis.analysisSummary || analysis.pageSummary || '',
      issues: [], // TODO: Extract from analysis data or separate table
      recommendations: recommendationsArr.flatMap(rec => {
        if (Array.isArray(rec.recommendations)) {
          return rec.recommendations.map((recItem: any) => {
            // If it's a string, return as is
            if (typeof recItem === 'string') {
              return recItem;
            }
            // If it's an object, extract the description or title
            if (typeof recItem === 'object' && recItem !== null) {
              return recItem.description || recItem.title || recItem.text || JSON.stringify(recItem);
            }
            // Fallback to string conversion
            return String(recItem);
          });
        }
        return [];
      }),
      score: pageScore, // Use the actual page score that was working before
      createdAt: analysis.createdAt?.toISOString() || new Date().toISOString(),
      // Map section ratings from analysis data (keep original scale)
      sectionRatings: {
        title: analysis.titleOptimization || 0,
        description: analysis.metaDescription || 0,
        headings: analysis.headingStructure || 0,
        content: analysis.contentClarity || 0,
        schema: analysis.schemaMarkup || 0,
        images: 0, // Not available in current schema
        links: 0,  // Not available in current schema
      },
      // Map section recommendations - extract text from recommendation objects
      sectionRecommendations: recommendationsArr.reduce((acc, rec) => {
        if (Array.isArray(rec.recommendations)) {
          acc[rec.sectionType] = rec.recommendations.map((recItem: any) => {
            // If it's a string, return as is
            if (typeof recItem === 'string') {
              return recItem;
            }
            // If it's an object, extract the description or title
            if (typeof recItem === 'object' && recItem !== null) {
              return recItem.description || recItem.title || recItem.text || JSON.stringify(recItem);
            }
            // Fallback to string conversion
            return String(recItem);
          });
        } else {
          acc[rec.sectionType] = [];
        }
        return acc;
      }, {} as Record<string, string[]>)
    };

    this.sendSuccess(res, analysisResult);
  });

  /**
   * Trigger analysis for a page
   */
  public triggerPageAnalysis = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Validate request body (make it optional with defaults)
    const bodyData = req.body || {};
    const bodyValidation = this.validateBody(PageAnalysisSchema, bodyData);
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

    // Generate AI recommendations
    console.log('🚀 Starting AI recommendation generation...');
    try {
      console.log('🤖 Generating AI-powered recommendations...');
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
      console.log('✅ AI recommendations saved successfully');
    } catch (aiError) {
      console.error('❌ AI recommendation generation failed:', aiError);
      console.error('❌ Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
      console.log('⚠️ Analysis completed but AI recommendations failed - this is not critical');
      // Don't fail the analysis if AI recommendations fail
    }

    this.sendSuccess(res, {
      pageId,
      score: finalScore,
      analysisId: analysisResultId,
      message: 'Analysis completed successfully'
    });
  });

  /**
   * Save optimized content for a page
   */
  public savePageContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(PageContentSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const { contentType, originalContent, optimizedContent, generationContext, metadata, deployImmediately } = bodyValidation.data!;

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

    // Save content suggestion
    const [savedSuggestion] = await db.insert(contentSuggestions).values({
      pageId,
      contentType,
      suggestions: [{
        content: optimizedContent,
        originalContent,
        generationContext,
        metadata,
        createdAt: new Date().toISOString()
      }],
      requestContext: generationContext,
      aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }).returning();

    let savedContent = {
      id: savedSuggestion.id,
      pageId,
      contentType,
      originalContent,
      optimizedContent,
      generationContext,
      metadata,
      version: 1,
      isActive: deployImmediately ? 1 : 0,
      pageUrl: page.url,
      deployedAt: deployImmediately ? new Date() : null,
      deployedBy: deployImmediately ? userId : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // If deploying immediately, create a deployment record
    if (deployImmediately) {
      // Get current score for this section type
      const currentRating = await db.select()
        .from(contentRatings)
        .where(and(
          eq(contentRatings.pageId, pageId),
          eq(contentRatings.sectionType, contentType)
        ))
        .orderBy(desc(contentRatings.createdAt))
        .limit(1);

      const currentScore = currentRating[0]?.currentScore || 0;
      const estimatedNewScore = Math.min(10, currentScore + 2); // Estimate improvement

      await db.insert(contentDeployments).values({
        pageId,
        sectionType: contentType,
        previousScore: currentScore,
        newScore: estimatedNewScore,
        scoreImprovement: estimatedNewScore - currentScore,
        deployedContent: optimizedContent,
        aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        deployedBy: userId
      });

      // Note: Content ratings will be created during analysis process
      // We don't create them here without a valid analysisResultId
    }

    // Invalidate cache if content was deployed
    if (deployImmediately) {
      // Find site by page to get trackerId for cache invalidation
      await cache.invalidateTrackerContent(site.trackerId, page.url);
      console.log(`🗑️ Cache invalidated for tracker ${site.trackerId}, page ${page.url}`);
    }

    this.sendSuccess(res, savedContent, 'Content saved successfully', 201);
  });

  /**
   * Get optimized content for a page
   */
  public getPageContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;
    const { contentType } = req.query;

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

    let content = [];
    if (contentType) {
      // Get content suggestions for specific type
      const suggestions = await db.select()
        .from(contentSuggestions)
        .where(and(
          eq(contentSuggestions.pageId, pageId),
          eq(contentSuggestions.contentType, contentType as string)
        ))
        .orderBy(desc(contentSuggestions.generatedAt));

      // Get deployments for specific type
      const deployments = await db.select()
        .from(contentDeployments)
        .where(and(
          eq(contentDeployments.pageId, pageId),
          eq(contentDeployments.sectionType, contentType as string)
        ))
        .orderBy(desc(contentDeployments.deployedAt));

      // Combine suggestions and deployments into content format
      content = suggestions.map(suggestion => {
        const suggestionsArray = Array.isArray(suggestion.suggestions) ? suggestion.suggestions : [];
        const suggestionData = suggestionsArray[0] as any;
        const deployment = deployments.find(d => d.deployedContent === suggestionData?.content);
        
        return {
          id: suggestion.id,
          pageId: suggestion.pageId,
          contentType: suggestion.contentType,
          originalContent: suggestionData?.originalContent || '',
          optimizedContent: suggestionData?.content || '',
          aiModel: suggestion.aiModel,
          generationContext: suggestion.requestContext,
          metadata: suggestionData?.metadata || {},
          version: 1,
          isActive: deployment ? 1 : 0,
          pageUrl: page.url,
          deployedAt: deployment?.deployedAt || null,
          deployedBy: deployment?.deployedBy || null,
          createdAt: suggestion.generatedAt,
          updatedAt: suggestion.generatedAt
        };
      });
    } else {
      // Get all content types
      const allSuggestions = await db.select()
        .from(contentSuggestions)
        .where(eq(contentSuggestions.pageId, pageId))
        .orderBy(desc(contentSuggestions.generatedAt));

      const allDeployments = await db.select()
        .from(contentDeployments)
        .where(eq(contentDeployments.pageId, pageId))
        .orderBy(desc(contentDeployments.deployedAt));

      // Combine suggestions and deployments
      content = allSuggestions.map(suggestion => {
        const suggestionsArray = Array.isArray(suggestion.suggestions) ? suggestion.suggestions : [];
        const suggestionData = suggestionsArray[0] as any;
        const deployment = allDeployments.find(d => d.deployedContent === suggestionData?.content);
        
        return {
          id: suggestion.id,
          pageId: suggestion.pageId,
          contentType: suggestion.contentType,
          originalContent: suggestionData?.originalContent || '',
          optimizedContent: suggestionData?.content || '',
          aiModel: suggestion.aiModel,
          generationContext: suggestion.requestContext,
          metadata: suggestionData?.metadata || {},
          version: 1,
          isActive: deployment ? 1 : 0,
          pageUrl: page.url,
          deployedAt: deployment?.deployedAt || null,
          deployedBy: deployment?.deployedBy || null,
          createdAt: suggestion.generatedAt,
          updatedAt: suggestion.generatedAt
        };
      });
    }

    this.sendSuccess(res, {
      pageId,
      content
    });
  });

  /**
   * Get section ratings for a page
   */
  public getSectionRatings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    try {
      // Get section ratings from contentRatings table
      const sectionRatings = await EnhancedRatingService.getCurrentSectionRatings(pageId);
      
      // Get section recommendations
      const recommendations = await Promise.all([
        EnhancedRatingService.getSectionRecommendations(pageId, 'title'),
        EnhancedRatingService.getSectionRecommendations(pageId, 'description'),
        EnhancedRatingService.getSectionRecommendations(pageId, 'headings'),
        EnhancedRatingService.getSectionRecommendations(pageId, 'content'),
        EnhancedRatingService.getSectionRecommendations(pageId, 'schema'),
        EnhancedRatingService.getSectionRecommendations(pageId, 'images'),
        EnhancedRatingService.getSectionRecommendations(pageId, 'links'),
      ])
      const sectionRecommendations = {
        title: recommendations[0],
        description: recommendations[1],
        headings: recommendations[2],
        content: recommendations[3],
        schema: recommendations[4],
        images: recommendations[5],
        links: recommendations[6],
      };

      this.sendSuccess(res, {
        pageId,
        sectionRatings: sectionRatings || {
          title: 0,
          description: 0,
          headings: 0,
          content: 0,
          schema: 0,
          images: 0,
          links: 0,
        },
        sectionRecommendations
      });
    } catch (error) {
      console.error('Error fetching section ratings:', error);
      return this.sendError(res, 'Failed to fetch section ratings', 500);
    }
  });

  /**
   * Update section rating after content deployment
   */
  public updateSectionRating = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Validate request body
    const { sectionType, newScore, deployedContent, aiModel } = req.body;
    
    if (!sectionType || typeof newScore !== 'number' || !deployedContent) {
      return this.sendError(res, 'Missing required fields: sectionType, newScore, deployedContent', 400);
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
      // Get current rating for this section
      const currentRating = await db.select()
        .from(contentRatings)
        .where(and(
          eq(contentRatings.pageId, pageId),
          eq(contentRatings.sectionType, sectionType)
        ))
        .orderBy(desc(contentRatings.createdAt))
        .limit(1);

      // Get the actual previous score (current score before this deployment)
      const previousScore = currentRating[0]?.currentScore ?? 0;
      const scoreImprovement = newScore - previousScore;

      // Update or create content rating
      if (currentRating.length > 0) {
        // Update existing rating
        await db.update(contentRatings)
          .set({
            currentScore: newScore,
            previousScore: previousScore,
            improvementCount: (currentRating[0].improvementCount || 0) + 1,
            lastImprovedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(contentRatings.id, currentRating[0].id));
      } else {
        // Create new rating (we need a valid analysisResultId)
        // For now, we'll create a placeholder analysis result
        const [analysisRecord] = await db.insert(contentAnalysis).values({
          pageId,
          overallScore: newScore * 10, // Convert to 0-100 scale
          llmModelUsed: aiModel || 'gpt-4o-mini',
          analyzedAt: new Date()
        }).returning();

        await db.insert(contentRatings).values({
          pageId,
          analysisResultId: analysisRecord.id,
          sectionType,
          currentScore: newScore,
          previousScore: previousScore,
          improvementCount: 1,
          lastImprovedAt: new Date()
        });
      }

      // Note: Deployment record is already created by savePageContent endpoint
      // This endpoint only handles rating updates

      // Update page and site scores based on new section ratings
      const { ScoreUpdateService } = await import('../services/scoreUpdateService');
      await ScoreUpdateService.updatePageScore(pageId);
      console.log(`🔄 Updated page and site scores after ${sectionType} improvement`);

      this.sendSuccess(res, {
        message: 'Section rating updated successfully',
        sectionType,
        previousScore,
        newScore,
        scoreImprovement
      });
    } catch (error) {
      console.error('Error updating section rating:', error);
      return this.sendError(res, 'Failed to update section rating', 500);
    }
  });

  public getOriginalPageContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    // Parse content snapshot to extract original content
    let originalContent = {
      title: page.title || '',
      metaDescription: '',
      headings: [],
      bodyText: '',
      images: 0,
      links: 0
    };

    if (page.contentSnapshot) {
      try {
        const contentSnapshot = JSON.parse(page.contentSnapshot);
        originalContent = {
          title: contentSnapshot.title || page.title || '',
          metaDescription: contentSnapshot.metaDescription || '',
          headings: contentSnapshot.headings || [],
          bodyText: contentSnapshot.bodyText || contentSnapshot.content || '',
          images: contentSnapshot.images || 0,
          links: contentSnapshot.links || 0
        };
      } catch (error) {
        console.warn('Failed to parse content snapshot for page', pageId, error);
        // Fallback to basic data
        originalContent.title = page.title || '';
      }
    }

    // Get latest analysis for context
    const analysisArr = await db
      .select()
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(1);

    const analysis = analysisArr[0];
    let analysisContext = null;
    if (analysis) {
      analysisContext = {
        score: analysis.overallScore || 0,
        summary: analysis.analysisSummary || '',
        keywordAnalysis: {
          primaryKeywords: analysis.primaryKeywords || [],
          longTailKeywords: analysis.longTailKeywords || [],
          semanticKeywords: analysis.semanticKeywords || []
        },
        issues: [],
        recommendations: [],
        lastAnalyzedAt: analysis.analyzedAt?.toISOString() || new Date().toISOString()
      };
    }

    const response = {
      pageId: page.id,
      pageUrl: page.url,
      originalContent,
      pageSummary: analysis?.pageSummary || null,
      analysisContext,
      needsAnalysis: !analysis
    };

    this.sendSuccess(res, response);
  });

  /**
   * Generate section content based on recommendations
   */
  public generateSectionContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(SectionContentSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const { sectionType, selectedRecommendations, currentContent, additionalContext } = bodyValidation.data!;

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

    // Get latest analysis for the page
    const analysisArr = await db
      .select()
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(1);

    const analysis = analysisArr[0];
    if (!analysis) {
      return this.sendError(res, 'No analysis found for this page. Please run analysis first.', 400);
    }

    // Construct analysis data for content generation
    const analysisData = {
      score: analysis.overallScore || 0,
      summary: analysis.analysisSummary || '',
      issues: [],
      recommendations: [],
      contentQuality: {
        clarity: analysis.contentClarity || 0,
        structure: analysis.contentStructure || 0,
        completeness: analysis.contentCompleteness || 0
      },
      technicalSEO: {
        headingStructure: analysis.headingStructure || 0,
        semanticMarkup: 0,
        contentDepth: 0,
        titleOptimization: analysis.titleOptimization || 0,
        metaDescription: analysis.metaDescription || 0,
        schemaMarkup: analysis.schemaMarkup || 0
      },
      keywordAnalysis: {
        primaryKeywords: Array.isArray(analysis.primaryKeywords) ? analysis.primaryKeywords : [],
        longTailKeywords: Array.isArray(analysis.longTailKeywords) ? analysis.longTailKeywords : [],
        keywordDensity: analysis.keywordDensity || 0,
        semanticKeywords: Array.isArray(analysis.semanticKeywords) ? analysis.semanticKeywords : [],
        missingKeywords: []
      },
      llmOptimization: {
        definitionsPresent: analysis.definitionsPresent === 1,
        faqsPresent: analysis.faqsPresent === 1,
        structuredData: analysis.structuredData === 1,
        citationFriendly: analysis.citationFriendly === 1,
        topicCoverage: analysis.topicCoverage || 0,
        answerableQuestions: analysis.answerableQuestions || 0
      },
      sectionRatings: {
        title: Math.round((analysis.titleOptimization || 0) / 10),
        description: Math.round((analysis.metaDescription || 0) / 10),
        headings: Math.round((analysis.headingStructure || 0) / 10),
        content: Math.round((analysis.contentClarity || 0) / 10),
        schema: Math.round((analysis.schemaMarkup || 0) / 10),
        images: 0,
        links: 0
      },
      contentRecommendations: {
        title: [],
        description: [],
        headings: [],
        content: [],
        schema: [],
        images: [],
        links: []
      }
    };

    // Construct page content object
    const pageContent = {
      url: page.url,
      title: page.title || '',
      metaDescription: '',
      bodyText: page.contentSnapshot || '',
      summary: analysis.analysisSummary || '',
      pageSummary: analysis.pageSummary || ''
    };

    // Generate content based on selected recommendations
    const generatedContent = await AnalysisService.generateSectionContent(
      sectionType,
      selectedRecommendations,
      pageContent,
      analysisData,
      currentContent || '',
      additionalContext || ''
    );

    // Calculate estimated score improvement
    const estimatedImprovement = AnalysisService.estimateScoreImprovement(
      sectionType,
      selectedRecommendations,
      analysisData
    );

    this.sendSuccess(res, {
      sectionType,
      generatedContent,
      estimatedImprovement,
      recommendations: selectedRecommendations
    });
  });

  /**
   * Delete a page
   */
  public deletePage = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    try {
      // Count related records before deletion for response
      const [contentAnalysisCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contentAnalysis)
        .where(eq(contentAnalysis.pageId, pageId));

      const [contentSuggestionsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contentSuggestions)
        .where(eq(contentSuggestions.pageId, pageId));

      const [pageAnalyticsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pageAnalytics)
        .where(eq(pageAnalytics.pageUrl, page.url));

      // Delete related records first (cascade delete in correct order)
      // First delete records that reference content_analysis
      await db.delete(contentRatings).where(eq(contentRatings.pageId, pageId));
      await db.delete(contentRecommendations).where(eq(contentRecommendations.pageId, pageId));
      
      // Then delete content_analysis (which content_ratings and content_recommendations reference)
      await db.delete(contentAnalysis).where(eq(contentAnalysis.pageId, pageId));
      
      // Delete other page-related records
      await db.delete(contentSuggestions).where(eq(contentSuggestions.pageId, pageId));
      await db.delete(pageAnalytics).where(eq(pageAnalytics.pageUrl, page.url));
      await db.delete(contentDeployments).where(eq(contentDeployments.pageId, pageId));

      // Finally delete the page
      await db.delete(pages).where(eq(pages.id, pageId));

      // Update site metrics after page deletion
      await ScoreUpdateService.updateSiteMetrics(page.siteId);

      // Invalidate cache
      await cache.invalidateTrackerContent(site.trackerId, page.url);

      this.sendSuccess(res, {
        message: 'Page deleted successfully',
        deletedPageId: pageId,
        deletedRecords: {
          contentAnalysis: contentAnalysisCount.count,
          contentSuggestions: contentSuggestionsCount.count,
          pageAnalytics: pageAnalyticsCount.count
        }
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      return this.sendError(res, 'Failed to delete page', 500);
    }
  });

  /**
   * Get cached content suggestions for a page
   */
  public getContentSuggestions = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pageId } = req.params;
    const { contentType } = req.query;

    if (!pageId) {
      return this.sendError(res, 'Page ID is required', 400);
    }

    try {
      // Verify page exists and user has access
      const page = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(and(
          eq(pages.id, pageId),
          eq(sites.userId, req.user!.userId)
        ))
        .limit(1);

      if (page.length === 0) {
        return this.sendError(res, 'Page not found or not authorized', 404);
      }

      // Get cached content suggestions
      const suggestions = await db
        .select()
        .from(contentSuggestions)
        .where(and(
          eq(contentSuggestions.pageId, pageId),
          contentType ? eq(contentSuggestions.contentType, contentType as string) : undefined
        ))
        .orderBy(desc(contentSuggestions.generatedAt));

      this.sendSuccess(res, {
        pageId,
        suggestions: suggestions.map(s => ({
          id: s.id,
          contentType: s.contentType,
          suggestions: s.suggestions,
          pageUrl: page[0].pages.url,
          generatedAt: s.generatedAt?.toISOString() || new Date().toISOString()
        }))
      });
    } catch (error) {
      console.error('Error getting content suggestions:', error);
      return this.sendError(res, 'Failed to get content suggestions', 500);
    }
  });

  /**
   * Generate new content suggestions for a page
   */
  public generateContentSuggestions = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pageId } = req.params;
    const { contentType, currentContent, additionalContext } = req.body;

    if (!pageId) {
      return this.sendError(res, 'Page ID is required', 400);
    }

    if (!contentType) {
      return this.sendError(res, 'Content type is required', 400);
    }

    try {
      // Verify page exists and user has access
      const page = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(and(
          eq(pages.id, pageId),
          eq(sites.userId, req.user!.userId)
        ))
        .limit(1);

      if (page.length === 0) {
        return this.sendError(res, 'Page not found or not authorized', 404);
      }

      // Generate content suggestions using AI (simplified approach)
      const { AnalysisService } = await import('../utils/analysisService');
      
      // Create a basic PageContent object for suggestions
      const pageContent = {
        url: page[0].pages.url,
        title: page[0].pages.title || 'Untitled Page',
        metaDescription: '',
        bodyText: '',
        headings: [],
        htmlContent: '',
        schemaMarkup: [],
        images: [],
        links: []
      };

      // Create a basic analysis result
      const analysisResult = {
        id: 'temp',
        pageId: pageId,
        summary: 'Content suggestions for ' + contentType,
        issues: [],
        recommendations: [],
        score: 0,
        createdAt: new Date().toISOString(),
        contentQuality: {
          clarity: 0,
          structure: 0,
          completeness: 0
        },
        technicalSEO: {
          headingStructure: 0,
          semanticMarkup: 0,
          contentDepth: 0,
          titleOptimization: 0,
          metaDescription: 0,
          schemaMarkup: 0
        },
        keywordAnalysis: {
          primaryKeywords: [],
          longTailKeywords: [],
          keywordDensity: 0,
          semanticKeywords: [],
          missingKeywords: []
        },
        llmOptimization: {
          faqsPresent: false,
          definitionsPresent: false,
          structuredData: false,
          citationFriendly: false,
          topicCoverage: 0,
          answerableQuestions: 0
        },
        sectionRatings: {
          title: 0,
          description: 0,
          headings: 0,
          content: 0,
          schema: 0,
          images: 0,
          links: 0
        },
        sectionRecommendations: {
          title: [],
          description: [],
          headings: [],
          content: [],
          schema: [],
          images: [],
          links: []
        },
        contentRecommendations: {
          title: [],
          description: [],
          headings: [],
          content: [],
          schema: [],
          images: [],
          links: []
        }
      };

      const suggestions = await AnalysisService.generateContentSuggestions(
        pageContent,
        analysisResult
      );

      // Save suggestions to database
      const [savedSuggestion] = await db
        .insert(contentSuggestions)
        .values({
          pageId: pageId,
          contentType: contentType,
          suggestions: JSON.stringify(suggestions),
          requestContext: additionalContext || null,
          aiModel: 'gpt-4'
        })
        .returning();

      this.sendSuccess(res, {
        contentType,
        suggestions: suggestions,
        pageUrl: page[0].pages.url,
        generatedAt: savedSuggestion.generatedAt?.toISOString() || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating content suggestions:', error);
      return this.sendError(res, 'Failed to generate content suggestions', 500);
    }
  });

  /**
   * Get all deployed content for a page
   */
  public getDeployedContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pageId } = req.params;

    if (!pageId) {
      return this.sendError(res, 'Page ID is required', 400);
    }

    try {
      // Verify page exists and user has access
      const page = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(and(
          eq(pages.id, pageId),
          eq(sites.userId, req.user!.userId)
        ))
        .limit(1);

      if (page.length === 0) {
        return this.sendError(res, 'Page not found or not authorized', 404);
      }

      // Get deployed content for the page
      const deployedContent = await db
        .select()
        .from(contentDeployments)
        .where(eq(contentDeployments.pageId, pageId))
        .orderBy(desc(contentDeployments.deployedAt));

      this.sendSuccess(res, {
        pageId,
        pageUrl: page[0].pages.url,
        deployedContent: deployedContent.map(content => ({
          id: content.id,
          sectionType: content.sectionType,
          deployedContent: content.deployedContent,
          previousScore: content.previousScore,
          newScore: content.newScore,
          scoreImprovement: content.scoreImprovement,
          deployedAt: content.deployedAt?.toISOString() || null,
          deployedBy: content.deployedBy || null,
          aiModel: content.aiModel || null
        }))
      });
    } catch (error) {
      console.error('Error getting deployed content:', error);
      return this.sendError(res, 'Failed to get deployed content', 500);
    }
  });

  /**
   * Refresh page content from live URL
   */
  public refreshPageContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pageId } = req.params;

    if (!pageId) {
      return this.sendError(res, 'Page ID is required', 400);
    }

    try {
      // Verify page exists and user has access
      const page = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(and(
          eq(pages.id, pageId),
          eq(sites.userId, req.user!.userId)
        ))
        .limit(1);

      if (page.length === 0) {
        return this.sendError(res, 'Page not found or not authorized', 404);
      }

      // Refresh content from live URL
      const { AnalysisService } = await import('../utils/analysisService');
      
      const analysisResult = await AnalysisService.analyzePage({ url: page[0].pages.url }) as any;
      
      // Update page with refreshed content
      await db.update(pages)
        .set({
          contentSnapshot: JSON.stringify(analysisResult.content),
          title: analysisResult.content.title || page[0].pages.title,
          lastScannedAt: new Date()
        })
        .where(eq(pages.id, pageId));

      this.sendSuccess(res, {
        message: 'Page content refreshed successfully',
        content: analysisResult.content,
        contentSnapshot: JSON.stringify(analysisResult.content),
        refreshedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error refreshing page content:', error);
      return this.sendError(res, 'Failed to refresh page content', 500);
    }
  });

  /**
   * Get section improvements for a page
   */
  public getSectionImprovements = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pageId } = req.params;
    const { sectionType } = req.query;

    if (!pageId) {
      return this.sendError(res, 'Page ID is required', 400);
    }

    if (!sectionType) {
      return this.sendError(res, 'Section type is required', 400);
    }

    try {
      // Verify page exists and user has access
      const page = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(and(
          eq(pages.id, pageId),
          eq(sites.userId, req.user!.userId)
        ))
        .limit(1);

      if (page.length === 0) {
        return this.sendError(res, 'Page not found or not authorized', 404);
      }

      // Get section improvements from content deployments
      const improvements = await db
        .select()
        .from(contentDeployments)
        .where(and(
          eq(contentDeployments.pageId, pageId),
          eq(contentDeployments.sectionType, sectionType as string)
        ))
        .orderBy(desc(contentDeployments.deployedAt));

      this.sendSuccess(res, {
        pageId,
        sectionType,
        improvements: improvements.map(improvement => ({
          id: improvement.id,
          previousScore: improvement.previousScore,
          newScore: improvement.newScore,
          scoreImprovement: improvement.scoreImprovement,
          deployedContent: improvement.deployedContent,
          deployedAt: improvement.deployedAt?.toISOString() || new Date().toISOString()
        }))
      });
    } catch (error) {
      console.error('Error getting section improvements:', error);
      return this.sendError(res, 'Failed to get section improvements', 500);
    }
  });

  }
