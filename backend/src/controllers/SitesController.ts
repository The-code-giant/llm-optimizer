import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, users, pages, pageAnalytics, trackerData, contentAnalysis, contentSuggestions } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { sitemapImportQueue, analysisQueue } from '../utils/queue';
import { randomUUID } from 'crypto';
import cache from '../utils/cache';
import { AnalysisService } from '../utils/analysisService';
import { EnhancedRatingService } from '../utils/enhancedRatingService';
import { ScoreUpdateService } from '../services/scoreUpdateService';
import { userService } from '../services/user.service';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { 
  CreateSiteSchema, 
  UpdateSiteSchema, 
  SitemapImportSchema,
  BulkAnalysisSchema,
  CreatePageSchema,
  UUIDSchema,
  PaginationQuerySchema 
} from '../types/dtos';

export class SitesController extends BaseController {
  /**
   * Create a new site
   */
  public createSite = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);

    // Validate request body
    const bodyValidation = this.validateBody(CreateSiteSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const { name, url } = bodyValidation.data!;

    // Check if site with this URL already exists for the user (excluding soft-deleted sites)
    const existingSite = await db
      .select()
      .from(sites)
      .where(and(
        eq(sites.userId, userId), 
        eq(sites.url, url),
        sql`${sites.deletedAt} IS NULL`
      ))
      .limit(1);

    if (existingSite.length > 0) {
      return this.sendError(res, 'A site with this URL already exists', 400);
    }

    // Generate unique tracker ID
    const trackerId = randomUUID();

    // Create the site
    const [newSite] = await db.insert(sites).values({
      userId,
      name,
      url,
      trackerId,
      status: 'created',
      settings: {}
    }).returning();

    // Automatically create a page for the main URL and run analysis
    try {
      console.log(`🔍 Creating initial page for site: ${newSite.id} - URL: ${url}`);
      
      // Create new page for the main URL
      const [newPage] = await db
        .insert(pages)
        .values({
          siteId: newSite.id,
          url: url,
          title: name, // Use site name as initial title
          pageScore: 0, // Initial score
          llmReadinessScore: 0, // Initial score
        })
        .returning();

      console.log(`📄 Created page ${newPage.id} for site ${newSite.id}`);

      // Perform synchronous analysis for the main page
      try {
        console.log(`🔍 Starting synchronous analysis for main page: ${newPage.id}`);
        
        // Import AnalysisService dynamically to avoid circular dependencies
        const { AnalysisService } = await import('../utils/analysisService');
        
        // Import additional services for comprehensive analysis
        const { EnhancedRatingService } = await import('../utils/enhancedRatingService');
        const { ScoreUpdateService } = await import('../services/scoreUpdateService');
        
        // Perform the actual analysis
        const analysisResult = await AnalysisService.analyzePage({
          url: url
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
            title: analysisResult.content.title || newPage.title,
            llmReadinessScore: finalScore,
            pageScore: finalScore,
            lastScoreUpdate: new Date(),
            lastAnalysisAt: new Date(),
            lastScannedAt: new Date()
          })
          .where(eq(pages.id, newPage.id));

        // Update site metrics
        console.log(`🔄 Updating site metrics after page analysis...`);
        await ScoreUpdateService.updateSiteMetrics(newSite.id);

        // Store analysis results in database
        let analysisResultId: string;
        try {
          const [analysisRecord] = await db.insert(contentAnalysis).values({
            pageId: newPage.id,
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
          console.log(`💾 Analysis results saved with ID: ${analysisResultId}`);
        } catch (dbError) {
          console.error('❌ Failed to save analysis results:', dbError);
          throw dbError;
        }

        // Generate AI recommendations
        console.log('🚀 Starting AI recommendation generation...');
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
          await AnalysisService.saveAIRecommendations(newPage.id, analysisResultId, aiRecommendations);
          console.log(`🤖 Generated and saved AI recommendations for page ${newPage.id}`);
          console.log('✅ AI recommendations saved successfully');
        } catch (aiError) {
          console.error('❌ AI recommendation generation failed:', aiError);
          console.error('❌ Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
          // Don't fail the analysis if AI recommendations fail
        }

        console.log(`✅ Comprehensive analysis completed for main page ${newPage.id} - Score: ${finalScore}/100`);
        
      } catch (error) {
        console.error('Failed to analyze main page synchronously:', error);
        // Don't fail the site creation if analysis fails
        console.log(`⚠️ Site ${newSite.id} created and page ${newPage.id} created but analysis failed - user can retry later`);
      }

    } catch (error) {
      console.error('Failed to create initial page for site:', error);
      // Don't fail the site creation if page creation fails
      console.log(`⚠️ Site ${newSite.id} created but initial page creation failed - user can add pages manually`);
    }

    this.sendSuccess(res, newSite, 'Site created successfully', 201);
  });

  /**
   * Get all sites for the authenticated user
   */
  public getSites = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    
    // Get pagination parameters
    const paginationParams = this.getPaginationParams(req.query);
    const { page, limit, offset } = paginationParams;

    const userSites = await db
      .select()
      .from(sites)
      .where(and(eq(sites.userId, userId), sql`${sites.deletedAt} IS NULL`))
      .orderBy(desc(sites.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sites)
      .where(and(eq(sites.userId, userId), sql`${sites.deletedAt} IS NULL`));

    this.sendSuccess(res, {
      sites: userSites,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  });

  /**
   * Get a specific site by ID
   */
  public getSite = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    const siteArr = await db
      .select()
      .from(sites)
      .where(and(
        eq(sites.id, siteId), 
        eq(sites.userId, userId),
        sql`${sites.deletedAt} IS NULL`
      ))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    console.log('Site data being returned:', site);
    this.sendSuccess(res, site);
  });

  /**
   * Update a site
   */
  public updateSite = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(UpdateSiteSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const updateData = bodyValidation.data!;

    // Check if site exists and belongs to user (excluding soft-deleted sites)
    const siteArr = await db
      .select()
      .from(sites)
      .where(and(
        eq(sites.id, siteId), 
        eq(sites.userId, userId),
        sql`${sites.deletedAt} IS NULL`
      ))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    // If URL is being updated, check for conflicts (excluding soft-deleted sites)
    if (updateData.url && updateData.url !== site.url) {
      const existingSite = await db
        .select()
        .from(sites)
        .where(and(
          eq(sites.userId, userId), 
          eq(sites.url, updateData.url),
          sql`${sites.deletedAt} IS NULL`
        ))
        .limit(1);

      if (existingSite.length > 0) {
        return this.sendError(res, 'A site with this URL already exists', 400);
      }
    }

    // Update the site
    const [updatedSite] = await db
      .update(sites)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(sites.id, siteId))
      .returning();

    this.sendSuccess(res, updatedSite, 'Site updated successfully');
  });

  /**
   * Delete a site (soft delete)
   */
  public deleteSite = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Check if site exists and belongs to user (excluding soft-deleted sites)
    const siteArr = await db
      .select()
      .from(sites)
      .where(and(
        eq(sites.id, siteId), 
        eq(sites.userId, userId),
        sql`${sites.deletedAt} IS NULL`
      ))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Soft delete the site
    await db
      .update(sites)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(sites.id, siteId));

    this.sendSuccess(res, null, 'Site deleted successfully');
  });

  /**
   * Import sitemap for a site
   */
  public importSitemap = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(SitemapImportSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const { sitemapUrl } = bodyValidation.data!;

    // Check if site exists and belongs to user
    const siteArr = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Use provided sitemap URL or default to site URL + /sitemap.xml
    const finalSitemapUrl = sitemapUrl || `${site.url}/sitemap.xml`;

    try {
      // Update site status
      await db
        .update(sites)
        .set({ status: 'importing', updatedAt: new Date() })
        .where(eq(sites.id, siteId));

      // Queue sitemap import job
      const job = await sitemapImportQueue.add('import-sitemap', {
        siteId,
        sitemapUrl: finalSitemapUrl
      });

      this.sendSuccess(res, {
        message: 'Sitemap import started',
        jobId: job.id,
        sitemapUrl: finalSitemapUrl
      }, 'Sitemap import queued successfully', 202);
    } catch (error) {
      // Revert status on error
      await db
        .update(sites)
        .set({ status: 'ready', updatedAt: new Date() })
        .where(eq(sites.id, siteId));

      console.error('Error queuing sitemap import:', error);
      return this.sendError(res, 'Failed to start sitemap import', 500);
    }
  });

  /**
   * Get pages for a site
   */
  public getSitePages = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Validate query parameters
    const queryValidation = this.validateQuery(PaginationQuerySchema, req.query);
    if (!queryValidation.isValid) {
      return this.sendError(res, 'Invalid query parameters', 400, queryValidation.errors);
    }

    const queryData = queryValidation.data!;
    const { search, sortBy, sortOrder, scoreFilter } = queryData;
    const page = queryData.page!; // Safe because schema has default
    const limit = queryData.limit!; // Safe because schema has default
    const offset = (page - 1) * limit;

    // Check if site exists and belongs to user
    const siteArr = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Build query conditions
    let whereConditions = eq(pages.siteId, siteId);
    if (search) {
      whereConditions = and(
        whereConditions,
        sql`(${pages.title} ILIKE ${`%${search}%`} OR ${pages.url} ILIKE ${`%${search}%`})`
      )!;
    }

    // Add score filtering
    if (scoreFilter && scoreFilter !== 'all') {
      let scoreCondition;
      if (scoreFilter === 'high') {
        scoreCondition = sql`${pages.pageScore} >= 75`;
      } else if (scoreFilter === 'medium') {
        scoreCondition = sql`${pages.pageScore} >= 60 AND ${pages.pageScore} < 75`;
      } else if (scoreFilter === 'low') {
        scoreCondition = sql`${pages.pageScore} < 60`;
      }
      
      if (scoreCondition) {
        whereConditions = and(whereConditions, scoreCondition)!;
      }
    }

    // Build order by clause
    let orderBy;
    if (sortBy === 'title') {
      orderBy = sortOrder === 'asc' ? pages.title : desc(pages.title);
    } else if (sortBy === 'score') {
      orderBy = sortOrder === 'asc' ? pages.pageScore : desc(pages.pageScore);
    } else if (sortBy === 'lastAnalysis') {
      orderBy = sortOrder === 'asc' ? pages.lastAnalysisAt : desc(pages.lastAnalysisAt);
    } else {
      orderBy = desc(pages.createdAt);
    }

    // Get pages
    const sitePages = await db
      .select()
      .from(pages)
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(whereConditions);

    this.sendSuccess(res, {
      pages: sitePages,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  });

  /**
   * Create a new page for a site
   */
  public createPage = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(CreatePageSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const { url, title } = bodyValidation.data!;

    // Check if site exists and belongs to user
    const siteArr = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Check if page already exists for this site
    const existingPage = await db
      .select()
      .from(pages)
      .where(and(eq(pages.siteId, siteId), eq(pages.url, url)))
      .limit(1);

    if (existingPage.length > 0) {
      return this.sendError(res, 'Page with this URL already exists', 400);
    }

    // Create new page
    const [newPage] = await db
      .insert(pages)
      .values({
        siteId: siteId,
        url: url,
        title: title || new URL(url).pathname,
        pageScore: 0, // Initial score
        llmReadinessScore: 0, // Initial score
      })
      .returning();

    // Perform synchronous analysis instead of queuing background job
    try {
      console.log(`🔍 Starting synchronous analysis for new page: ${newPage.id}`);
      
      // Import AnalysisService dynamically to avoid circular dependencies
      const { AnalysisService } = await import('../utils/analysisService');
      
      // Import additional services for comprehensive analysis
      const { EnhancedRatingService } = await import('../utils/enhancedRatingService');
      const { ScoreUpdateService } = await import('../services/scoreUpdateService');
      
      // Perform the actual analysis
      const analysisResult = await AnalysisService.analyzePage({
        url: url
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
          title: analysisResult.content.title || newPage.title,
          llmReadinessScore: finalScore,
          pageScore: finalScore,
          lastScoreUpdate: new Date(),
          lastAnalysisAt: new Date(),
          lastScannedAt: new Date()
        })
        .where(eq(pages.id, newPage.id));

      // Update site metrics
      console.log(`🔄 Updating site metrics after page analysis...`);
      await ScoreUpdateService.updateSiteMetrics(siteId);

      // Store analysis results in database
      let analysisResultId: string;
      try {
        const [analysisRecord] = await db.insert(contentAnalysis).values({
          pageId: newPage.id,
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
        console.log(`💾 Analysis results saved with ID: ${analysisResultId}`);
      } catch (dbError) {
        console.error('❌ Failed to save analysis results:', dbError);
        throw dbError;
      }

      // Generate AI recommendations (same as manual trigger)
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
        await AnalysisService.saveAIRecommendations(newPage.id, analysisResultId, aiRecommendations);
        console.log(`🤖 Generated and saved AI recommendations for page ${newPage.id}`);
        console.log('✅ AI recommendations saved successfully');
      } catch (aiError) {
        console.error('❌ AI recommendation generation failed:', aiError);
        console.error('❌ Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
        // Don't fail the analysis if AI recommendations fail
      }

      console.log(`✅ Comprehensive analysis completed for page ${newPage.id} - Score: ${finalScore}/100`);
      
    } catch (error) {
      console.error('Failed to analyze new page synchronously:', error);
      // Don't fail the page creation if analysis fails
      console.log(`⚠️ Page ${newPage.id} created but analysis failed - user can retry later`);
    }

    this.sendSuccess(res, newPage, 'Page created successfully', 201);
  });

  /**
   * Trigger analysis for all pages in a site
   */
  public triggerSiteAnalysis = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(BulkAnalysisSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const { pageIds, forceRefresh } = bodyValidation.data!;

    // Check if site exists and belongs to user
    const siteArr = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    try {
      // Get pages to analyze
      let pagesToAnalyze;
      if (pageIds && pageIds.length > 0) {
        // Analyze specific pages
        pagesToAnalyze = await db
          .select()
          .from(pages)
          .where(and(eq(pages.siteId, siteId), sql`${pages.id} = ANY(${pageIds})`));
      } else {
        // Analyze all pages
        pagesToAnalyze = await db
          .select()
          .from(pages)
          .where(eq(pages.siteId, siteId));
      }

      if (pagesToAnalyze.length === 0) {
        return this.sendError(res, 'No pages found to analyze', 400);
      }

      // Queue analysis jobs
      const jobs = [];
      for (const page of pagesToAnalyze) {
        const job = await analysisQueue.add('analyze-page', {
          pageId: page.id,
          forceRefresh
        });
        jobs.push(job.id);
      }

      this.sendSuccess(res, {
        message: `Analysis started for ${pagesToAnalyze.length} pages`,
        jobIds: jobs,
        pageCount: pagesToAnalyze.length
      }, 'Bulk analysis queued successfully', 202);
    } catch (error) {
      console.error('Error queuing bulk analysis:', error);
      return this.sendError(res, 'Failed to start bulk analysis', 500);
    }
  });

  /**
   * Get site analytics summary
   */
  public getSiteAnalytics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Check if site exists and belongs to user
    const siteArr = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Get analytics data
    const [pageStats] = await db
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
      stats: pageStats,
      recentAnalysis
    });
  });

  /**
   * Get tracking script for a site
   */
  public getTrackerScript = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;
    const platform = req.query.platform as string || 'nextjs';

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Generate the API base URL
    const apiBase = process.env.NODE_ENV === "production"
      ? process.env.API_URL || "https://backend.cleversearch.ai"
      : "http://localhost:3001";

    // Generate Next.js Script component with simplified configuration
    const nextScriptFormat = `<Script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config={JSON.stringify({
    SITE_ID: "${site.trackerId}"
  })}
  async
  strategy="beforeInteractive"
/>`;

    // Generate platform-specific scripts
    const platformScripts = {
      nextjs: nextScriptFormat,
      react: `<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID": "${site.trackerId}"}'
  async
></script>`,
      wordpress: `<!-- Cleversearch Tracking Script -->
<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID": "${site.trackerId}"}'
  async
></script>`,
      shopify: `<!-- Cleversearch Tracking Script -->
<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID": "${site.trackerId}"}'
  async
></script>`,
      wix: `<!-- Cleversearch Tracking Script -->
<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID": "${site.trackerId}"}'
  async
></script>`,
      squarespace: `<!-- Cleversearch Tracking Script -->
<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID": "${site.trackerId}"}'
  async
></script>`,
      other: `<!-- Cleversearch Tracking Script -->
<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID": "${site.trackerId}"}'
  async
></script>`
    };

    // Get the script for the requested platform
    const selectedScript = platformScripts[platform as keyof typeof platformScripts] || platformScripts.other;

    this.sendSuccess(res, {
      siteId: site.id,
      siteName: site.name,
      trackerId: site.trackerId,
      nextJsScript: nextScriptFormat,
      scriptHtml: selectedScript,
      platform: platform,
      config: {
        API_BASE: apiBase,
        SITE_ID: site.trackerId
      },
      instructions: {
        nextjs: "Add the Next.js script to your _app.js or layout file",
        react: "Add the script to your main HTML file",
        wordpress: "Add the script to your theme's header.php file",
        shopify: "Add the script to your theme.liquid file in the <head> section",
        wix: "Add the script to your site's custom code in the <head> section",
        squarespace: "Add the script to your site's code injection in the header",
        other: "Add the script to your HTML head section"
      }
    });
  });

  /**
   * Get demographics analytics for a site
   */
  public getDemographicsAnalytics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;
    const timeRange = req.query.timeRange as string || '7d';

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get basic analytics data from pageAnalytics (demographics not available in current schema)
    const analyticsData = await db
      .select({
        pageUrl: pageAnalytics.pageUrl,
        pageViews: pageAnalytics.pageViews,
        uniqueVisitors: pageAnalytics.uniqueVisitors,
        bounceRate: pageAnalytics.bounceRate,
        avgSessionDuration: pageAnalytics.avgSessionDuration,
        loadTimeMs: pageAnalytics.loadTimeMs,
        contentInjected: pageAnalytics.contentInjected,
        contentTypesInjected: pageAnalytics.contentTypesInjected,
        visitDate: pageAnalytics.visitDate
      })
      .from(pageAnalytics)
      .where(and(
        eq(pageAnalytics.siteId, siteId),
        sql`${pageAnalytics.createdAt} >= ${startDate}`
      ));

    // Since demographics fields don't exist in current schema, return empty demographics
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const countries: Record<string, number> = {};

    this.sendSuccess(res, {
      devices,
      browsers,
      countries,
      timeRange
    });
  });

  /**
   * Get page performance analytics for a site
   */
  public getPagePerformanceAnalytics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;
    const timeRange = req.query.timeRange as string || '7d';

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get top pages by views (using available fields)
    const topPages = await db
      .select({
        pageUrl: pageAnalytics.pageUrl,
        pageViews: pageAnalytics.pageViews,
        uniqueVisitors: pageAnalytics.uniqueVisitors,
        bounceRate: pageAnalytics.bounceRate,
        avgSessionDuration: pageAnalytics.avgSessionDuration,
        loadTimeMs: pageAnalytics.loadTimeMs
      })
      .from(pageAnalytics)
      .where(and(
        eq(pageAnalytics.siteId, siteId),
        sql`${pageAnalytics.createdAt} >= ${startDate}`
      ))
      .orderBy(desc(pageAnalytics.pageViews))
      .limit(10);

    // Get overall performance metrics (using available fields)
    const performanceMetrics = await db
      .select({
        totalViews: sql<number>`sum(${pageAnalytics.pageViews})`,
        totalUniqueVisitors: sql<number>`sum(${pageAnalytics.uniqueVisitors})`,
        avgBounceRate: sql<number>`avg(${pageAnalytics.bounceRate})`,
        avgSessionDuration: sql<number>`avg(${pageAnalytics.avgSessionDuration})`,
        avgLoadTime: sql<number>`avg(${pageAnalytics.loadTimeMs})`
      })
      .from(pageAnalytics)
      .where(and(
        eq(pageAnalytics.siteId, siteId),
        sql`${pageAnalytics.createdAt} >= ${startDate}`
      ));

    this.sendSuccess(res, {
      topPages,
      performanceMetrics: performanceMetrics[0] || {
        totalViews: 0,
        totalUniqueVisitors: 0,
        avgBounceRate: 0,
        avgSessionDuration: 0,
        avgLoadTime: 0
      },
      timeRange
    });
  });

  /**
   * Pre-submit website URL for analysis (no authentication required)
   */
  public preSubmitWebsite = this.asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return this.sendError(res, 'URL is required', 400);
    }

    try {
      // Validate URL format
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./i, '');
      
      // Basic domain validation
      const validDomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!validDomainRegex.test(hostname)) {
        return this.sendError(res, 'Please enter a valid website domain format', 400);
      }

      // Check if site already exists
      const existingSite = await db
        .select()
        .from(sites)
        .where(eq(sites.url, url))
        .limit(1);

      if (existingSite.length > 0) {
        return this.sendSuccess(res, {
          success: true,
          message: 'Website already exists in our system',
          siteId: existingSite[0].id,
          redirectUrl: `/dashboard/${existingSite[0].id}`
        });
      }

      // For pre-submit, we just validate and return success
      // The actual site creation happens after user signs up
      this.sendSuccess(res, {
        success: true,
        message: 'Website URL validated successfully. Please sign up to continue.',
        redirectUrl: '/sign-up'
      });
    } catch (error) {
      console.error('Error in pre-submit:', error);
      return this.sendError(res, 'Invalid URL format', 400);
    }
  });

}
