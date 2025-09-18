import { Request, Response } from 'express';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { FirecrawlService } from '../services/FirecrawlService';
import { db } from '../../db/client';
import { sites, pages, contentAnalysis } from '../../db/schema';
import { eq, and, desc, like, sql, count } from 'drizzle-orm';

export class PagesControllerV2 extends BaseController {
  private firecrawlService: FirecrawlService;

  constructor() {
    super();
    this.firecrawlService = new FirecrawlService();
  }

  /**
   * Get pages with enhanced content using Firecrawl
   */
  getPages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { page = 1, limit = 20, search, sortBy = 'lastAnalysisAt', sortOrder = 'desc' } = req.query;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Build query conditions
      const conditions = [eq(pages.siteId, siteId)];
      if (search) {
        conditions.push(
          sql`(${pages.url} ILIKE ${`%${search}%`} OR ${pages.title} ILIKE ${`%${search}%`})`
        );
      }

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(pages)
        .where(and(...conditions));

      const total = totalResult[0].count;

      // Calculate pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build sort order
      let orderBy;
      switch (sortBy) {
        case 'url':
          orderBy = sortOrder === 'asc' ? pages.url : desc(pages.url);
          break;
        case 'title':
          orderBy = sortOrder === 'asc' ? pages.title : desc(pages.title);
          break;
        case 'pageScore':
          orderBy = sortOrder === 'asc' ? pages.pageScore : desc(pages.pageScore);
          break;
        case 'createdAt':
          orderBy = sortOrder === 'asc' ? pages.createdAt : desc(pages.createdAt);
          break;
        default:
          orderBy = sortOrder === 'asc' ? pages.lastAnalysisAt : desc(pages.lastAnalysisAt);
      }

      // Get pages with analysis data
      const pagesResult = await db
        .select({
          id: pages.id,
          url: pages.url,
          title: pages.title,
          contentSnapshot: pages.contentSnapshot,
          lastScannedAt: pages.lastScannedAt,
          lastAnalysisAt: pages.lastAnalysisAt,
          pageScore: pages.pageScore,
          createdAt: pages.createdAt,
          updatedAt: pages.updatedAt,
          analysisCount: sql<number>`COUNT(${contentAnalysis.id})`,
          latestAnalysis: sql<any>`
            JSON_BUILD_OBJECT(
              'id', MAX(${contentAnalysis.id}),
              'overallScore', MAX(${contentAnalysis.overallScore}),
              'analyzedAt', MAX(${contentAnalysis.analyzedAt}),
              'llmModelUsed', MAX(${contentAnalysis.llmModelUsed}),
              'analysisVersion', MAX(${contentAnalysis.analysisVersion})
            )
          `
        })
        .from(pages)
        .leftJoin(contentAnalysis, eq(pages.id, contentAnalysis.pageId))
        .where(and(...conditions))
        .groupBy(
          pages.id,
          pages.url,
          pages.title,
          pages.contentSnapshot,
          pages.lastScannedAt,
          pages.lastAnalysisAt,
          pages.pageScore,
          pages.createdAt,
          pages.updatedAt
        )
        .orderBy(orderBy)
        .limit(limitNum)
        .offset(offset);

      this.success(res, {
        pages: pagesResult,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        },
        siteId,
        search
      });

    } catch (error) {
      this.handleError(res, error, 'Get Pages');
    }
  };

  /**
   * Create or update page with enhanced content extraction
   */
  createOrUpdatePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { url, extractContent = true } = req.body;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Check if page already exists
      const existingPage = await db
        .select()
        .from(pages)
        .where(
          and(
            eq(pages.siteId, siteId),
            eq(pages.url, url)
          )
        )
        .limit(1);

      let pageData: any = {
        url,
        lastScannedAt: new Date(),
        updatedAt: new Date()
      };

      // Extract content using Firecrawl if requested
      if (extractContent) {
        try {
          const firecrawlResult = await this.firecrawlService.scrapeUrl(url, {
            extractMainContent: true,
            includeLinks: false
          });

          if (firecrawlResult.success && firecrawlResult.data) {
            pageData.title = firecrawlResult.data.metadata.title || null;
            pageData.contentSnapshot = firecrawlResult.data.content;
          }
        } catch (error: any) {
          // Log the error but don't fail the page creation
          console.warn(`Firecrawl extraction failed for ${url}:`, error.message);
        }
      }

      let page;
      if (existingPage.length > 0) {
        // Update existing page
        const updatedPages = await db
          .update(pages)
          .set(pageData)
          .where(eq(pages.id, existingPage[0].id))
          .returning();
        page = updatedPages[0];
      } else {
        // Create new page
        pageData.siteId = siteId;
        pageData.createdAt = new Date();
        const newPages = await db
          .insert(pages)
          .values(pageData)
          .returning();
        page = newPages[0];
      }

      this.success(res, {
        page,
        isNew: existingPage.length === 0,
        contentExtracted: extractContent && !!pageData.contentSnapshot
      }, existingPage.length === 0 ? 'Page created successfully' : 'Page updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Create/Update Page');
    }
  };

  /**
   * Get page details with all analysis history
   */
  getPageDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId, pageId } = req.params;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site and page ownership
      const pageResult = await db
        .select({
          page: pages,
          site: sites
        })
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(
          and(
            eq(pages.id, pageId),
            eq(pages.siteId, siteId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (pageResult.length === 0) {
        return this.error(res, 'Page not found or not authorized', 404);
      }

      const { page, site } = pageResult[0];

      // Get analysis history
      const analysisHistory = await db
        .select()
        .from(contentAnalysis)
        .where(eq(contentAnalysis.pageId, pageId))
        .orderBy(desc(contentAnalysis.analyzedAt))
        .limit(50);

      // Get latest enhanced content if available
      let enhancedContent = null;
      const latestV2Analysis = analysisHistory.find(a => a.analysisVersion === '2.0');
      
      if (latestV2Analysis) {
        // Try to get enhanced content from the latest analysis
        try {
          const freshContent = await this.firecrawlService.scrapeUrl(page.url, {
            extractMainContent: true,
            includeLinks: true
          });
          
          if (freshContent.success && freshContent.data) {
            enhancedContent = {
              content: freshContent.data.content,
              markdown: freshContent.data.markdown,
              metadata: freshContent.data.metadata,
              extractedAt: new Date()
            };
          }
        } catch (error) {
          // Enhanced content extraction failed, continue without it
          console.warn(`Enhanced content extraction failed for page ${pageId}:`, error);
        }
      }

      this.success(res, {
        page,
        site,
        analysisHistory: analysisHistory.map(analysis => ({
          id: analysis.id,
          overallScore: analysis.overallScore,
          analyzedAt: analysis.analyzedAt,
          llmModelUsed: analysis.llmModelUsed,
          analysisVersion: analysis.analysisVersion,
          confidence: analysis.confidence,
          enhancementLevel: analysis.analysisVersion === '2.0' ? 'firecrawl' : 'basic'
        })),
        enhancedContent,
        hasEnhancedAnalysis: !!latestV2Analysis
      });

    } catch (error) {
      this.handleError(res, error, 'Get Page Details');
    }
  };

  /**
   * Bulk update pages with content extraction
   */
  bulkUpdatePages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { pageIds, extractContent = true } = req.body;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Get pages to update
      const pagesToUpdate = await db
        .select()
        .from(pages)
        .where(
          and(
            eq(pages.siteId, siteId),
            pageIds?.length > 0 ? sql`${pages.id} = ANY(${pageIds})` : sql`true`
          )
        )
        .limit(50); // Safety limit

      const results = [];
      
      for (const page of pagesToUpdate) {
        try {
          let updateData: any = {
            lastScannedAt: new Date(),
            updatedAt: new Date()
          };

          // Extract content if requested
          if (extractContent) {
            try {
              const firecrawlResult = await this.firecrawlService.scrapeUrl(page.url, {
                extractMainContent: true,
                includeLinks: false
              });

              if (firecrawlResult.success && firecrawlResult.data) {
                updateData.title = firecrawlResult.data.metadata.title || page.title;
                updateData.contentSnapshot = firecrawlResult.data.content;
              }
            } catch (error: any) {
              console.warn(`Firecrawl extraction failed for ${page.url}:`, error.message);
            }
          }

          // Update page
          await db
            .update(pages)
            .set(updateData)
            .where(eq(pages.id, page.id));

          results.push({
            pageId: page.id,
            url: page.url,
            status: 'success',
            contentExtracted: extractContent && !!updateData.contentSnapshot
          });

        } catch (error: any) {
          results.push({
            pageId: page.id,
            url: page.url,
            status: 'error',
            error: error.message
          });
        }
      }

      this.success(res, {
        totalProcessed: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      }, 'Bulk page update completed');

    } catch (error) {
      this.handleError(res, error, 'Bulk Update Pages');
    }
  };

  /**
   * Delete page
   */
  deletePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId, pageId } = req.params;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify page ownership
      const pageResult = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(
          and(
            eq(pages.id, pageId),
            eq(pages.siteId, siteId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (pageResult.length === 0) {
        return this.error(res, 'Page not found or not authorized', 404);
      }

      // Delete page (cascade will handle related records)
      await db
        .delete(pages)
        .where(eq(pages.id, pageId));

      this.success(res, {
        pageId,
        deleted: true
      }, 'Page deleted successfully');

    } catch (error) {
      this.handleError(res, error, 'Delete Page');
    }
  };
}