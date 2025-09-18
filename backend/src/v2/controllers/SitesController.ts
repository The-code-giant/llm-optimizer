import { Request, Response } from 'express';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { FirecrawlService } from '../services/FirecrawlService';
import { SiteServiceV2 } from '../services/SiteServiceV2';
import { db } from '../../db/client';
import { sites, pages, contentAnalysis } from '../../db/schema';
import { eq, and, desc, sql, count, avg, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class SitesControllerV2 extends BaseController {
  private firecrawlService: FirecrawlService;
  private siteService: SiteServiceV2;

  constructor() {
    super();
    this.firecrawlService = new FirecrawlService();
    this.siteService = new SiteServiceV2();
  }

  /**
   * Get all sites for user
   */
  getSites = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as any; // Use any to access userId property
      const { includeMetrics = true } = req.query;

      let query = db
        .select({
          id: sites.id,
          name: sites.name,
          url: sites.url,
          trackerId: sites.trackerId,
          status: sites.status,
          settings: sites.settings,
          averageLLMScore: sites.averageLLMScore,
          totalPages: sites.totalPages,
          pagesWithScores: sites.pagesWithScores,
          lastMetricsUpdate: sites.lastMetricsUpdate,
          createdAt: sites.createdAt,
          updatedAt: sites.updatedAt
        })
        .from(sites)
        .where(
          and(
            eq(sites.userId, authenticatedReq.user.userId), // Use userId instead of id
            isNull(sites.deletedAt)
          )
        )
        .orderBy(desc(sites.createdAt));

      const userSites = await query;

      // Optionally include fresh metrics
      if (includeMetrics === 'true') {
        for (const site of userSites) {
          // Get fresh metrics if needed
          if (!site.lastMetricsUpdate || 
              new Date().getTime() - new Date(site.lastMetricsUpdate).getTime() > 24 * 60 * 60 * 1000) {
            await this.updateSiteMetrics(site.id);
          }
        }
      }

      this.success(res, {
        sites: userSites,
        total: userSites.length
      });

    } catch (error) {
      this.handleError(res, error, 'Get Sites');
    }
  };

  /**
   * Get single site with detailed metrics
   */
  getSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const authenticatedReq = req as any;

      // Get site details
      const siteResult = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.userId),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (siteResult.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      const site = siteResult[0];

      // Get detailed metrics
      const metrics = await this.getSiteMetrics(siteId);

      this.success(res, {
        site,
        metrics
      });

    } catch (error) {
      this.handleError(res, error, 'Get Site');
    }
  };

  /**
   * Create new site with enhanced Firecrawl discovery
   */
  createSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, url, autoCrawl = true, maxPages = 10 } = req.body;
      const authenticatedReq = req as any; // Use any to access userId property

      if (!name || !url) {
        return this.error(res, 'Name and URL are required', 400);
      }

      // Debug: Check if user is properly authenticated
      console.log('🔍 User ID from request:', authenticatedReq.user?.userId);
      console.log('🔍 User object:', authenticatedReq.user);

      if (!authenticatedReq.user?.userId) {
        return this.error(res, 'User not authenticated or user ID missing', 401);
      }

      // Use the new SiteServiceV2 for enhanced site creation
      const result = await this.siteService.createSiteWithCrawling(
        authenticatedReq.user.userId, // Use userId instead of id
        name,
        url,
        {
          autoCrawl,
          maxPages
        }
      );

      this.success(res, {
        site: result.site,
        crawling: result.crawlingStatus,
        message: `Site created successfully${result.crawlingStatus.enabled ? ` and ${result.crawlingStatus.pagesDiscovered} pages discovered` : ''}`
      }, 'Site created successfully');

    } catch (error: any) {
      this.handleError(res, error, 'Create Site');
    }
  };

  /**
   * Update site
   */
  updateSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { name, url, status, settings } = req.body;
      const authenticatedReq = req as any;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.userId),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date()
      };

      if (name !== undefined) updateData.name = name;
      if (url !== undefined) updateData.url = url;
      if (status !== undefined) updateData.status = status;
      if (settings !== undefined) updateData.settings = settings;

      // Update site
      const updatedSites = await db
        .update(sites)
        .set(updateData)
        .where(eq(sites.id, siteId))
        .returning();

      this.success(res, {
        site: updatedSites[0]
      }, 'Site updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Update Site');
    }
  };

  /**
   * Delete site (soft delete)
   */
  deleteSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const authenticatedReq = req as any;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.userId),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Soft delete
      await db
        .update(sites)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(sites.id, siteId));

      this.success(res, {
        siteId,
        deleted: true
      }, 'Site deleted successfully');

    } catch (error) {
      this.handleError(res, error, 'Delete Site');
    }
  };

  /**
   * Rediscover pages for an existing site using Firecrawl
   */
  rediscoverPages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { maxPages = 10 } = req.body;
      const authenticatedReq = req as any;

      // Use SiteServiceV2 to rediscover pages
      const result = await this.siteService.rediscoverSitePages(
        authenticatedReq.user.userId,
        siteId,
        maxPages
      );

      this.success(res, {
        siteId,
        discovery: result,
        message: `Page rediscovery completed. Found ${result.pagesDiscovered} new pages.`
      }, 'Pages rediscovered successfully');

    } catch (error: any) {
      this.handleError(res, error, 'Rediscover Pages');
    }
  };

  /**
   * Discover pages using Firecrawl (competitive intelligence)
   */
  discoverPages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { query, limit = 10 } = req.body;
      const authenticatedReq = req as any;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.userId),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Use Firecrawl to search for related pages
      const searchQuery = query || `site:${new URL(site[0].url).hostname}`;
      const searchResults = await this.firecrawlService.searchCompetitors(searchQuery, {
        limit: Math.min(limit, 20) // Safety limit
      });

      if (!searchResults.success) {
        return this.error(res, `Page discovery failed: ${searchResults.error}`, 500);
      }

      // Filter results to focus on the target site or related content
      const relevantPages = searchResults.data.filter(result => {
        try {
          const resultDomain = new URL(result.url).hostname;
          const siteDomain = new URL(site[0].url).hostname;
          return resultDomain === siteDomain || result.title.toLowerCase().includes(query?.toLowerCase() || '');
        } catch {
          return false;
        }
      });

      // Create pages that don't exist yet
      const newPages = [];
      for (const pageData of relevantPages) {
        try {
          const existingPage = await db
            .select()
            .from(pages)
            .where(
              and(
                eq(pages.siteId, siteId),
                eq(pages.url, pageData.url)
              )
            )
            .limit(1);

          if (existingPage.length === 0) {
            const createdPages = await db
              .insert(pages)
              .values({
                siteId,
                url: pageData.url,
                title: pageData.title || null,
                contentSnapshot: pageData.content || null,
                lastScannedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();

            newPages.push(createdPages[0]);
          }
        } catch (error: any) {
          console.warn(`Failed to create page ${pageData.url}:`, error.message);
        }
      }

      this.success(res, {
        siteId,
        query: searchQuery,
        totalFound: searchResults.data.length,
        relevantPages: relevantPages.length,
        newPagesCreated: newPages.length,
        newPages,
        discoveredPages: relevantPages.map(p => ({
          url: p.url,
          title: p.title,
          description: p.description
        }))
      }, `Discovered ${newPages.length} new pages`);

    } catch (error) {
      this.handleError(res, error, 'Discover Pages');
    }
  };

  /**
   * Update site metrics manually
   */
  updateMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const authenticatedReq = req as any;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.userId),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Update metrics
      const metrics = await this.updateSiteMetrics(siteId);

      this.success(res, {
        siteId,
        metrics,
        updatedAt: new Date()
      }, 'Site metrics updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Update Site Metrics');
    }
  };

  // Helper methods
  private async getSiteMetrics(siteId: string) {
    // Get page counts and scores
    const metricsResult = await db
      .select({
        totalPages: count(pages.id),
        pagesWithScores: sql<number>`COUNT(CASE WHEN ${pages.pageScore} IS NOT NULL THEN 1 END)`,
        avgScore: avg(pages.pageScore),
        recentAnalyses: sql<number>`COUNT(CASE WHEN ${contentAnalysis.analyzedAt} >= NOW() - INTERVAL '7 days' THEN 1 END)`,
        v2Analyses: sql<number>`COUNT(CASE WHEN ${contentAnalysis.analysisVersion} = '2.0' THEN 1 END)`
      })
      .from(pages)
      .leftJoin(contentAnalysis, eq(pages.id, contentAnalysis.pageId))
      .where(eq(pages.siteId, siteId));

    return metricsResult[0] || {
      totalPages: 0,
      pagesWithScores: 0,
      avgScore: 0,
      recentAnalyses: 0,
      v2Analyses: 0
    };
  }

  private async updateSiteMetrics(siteId: string) {
    const metrics = await this.getSiteMetrics(siteId);

    // Update the site record
    await db
      .update(sites)
      .set({
        totalPages: metrics.totalPages,
        pagesWithScores: metrics.pagesWithScores,
        averageLLMScore: Number(metrics.avgScore) || 0,
        lastMetricsUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(sites.id, siteId));

    return metrics;
  }

  private async discoverSitePages(siteId: string, siteUrl: string): Promise<any[]> {
    try {
      const domain = new URL(siteUrl).hostname;
      const searchResults = await this.firecrawlService.searchCompetitors(`site:${domain}`, {
        limit: 15
      });

      if (!searchResults.success) {
        throw new Error(searchResults.error || 'Search failed');
      }

      const newPages = [];
      for (const result of searchResults.data) {
        try {
          const existingPage = await db
            .select()
            .from(pages)
            .where(
              and(
                eq(pages.siteId, siteId),
                eq(pages.url, result.url)
              )
            )
            .limit(1);

          if (existingPage.length === 0) {
            const createdPages = await db
              .insert(pages)
              .values({
                siteId,
                url: result.url,
                title: result.title || null,
                contentSnapshot: result.content || null,
                lastScannedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();

            newPages.push(createdPages[0]);
          }
        } catch (error) {
          console.warn(`Failed to create discovered page: ${result.url}`, error);
        }
      }

      return newPages;
    } catch (error) {
      console.error('Page discovery failed:', error);
      return [];
    }
  }
}