import { Request, Response } from 'express';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { db } from '../../db/client';
import { sites, pages, contentAnalysis } from '../../db/schema';
import { eq, and, desc, gte, lte, sql, count, avg } from 'drizzle-orm';

export class AnalyticsControllerV2 extends BaseController {
  constructor() {
    super();
  }

  /**
   * Get enhanced analytics dashboard data
   */
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { siteId, period = '30d' } = req.query;

      // Calculate date range
      const periodDays = this.parsePeriod(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Base query conditions
      const baseConditions = [eq(sites.userId, authenticatedReq.user.id)];
      if (siteId) {
        baseConditions.push(eq(sites.id, siteId as string));
      }

      // Get sites overview
      const sitesOverview = await db
        .select({
          id: sites.id,
          name: sites.name,
          url: sites.url,
          totalPages: sites.totalPages,
          averageLLMScore: sites.averageLLMScore,
          pagesWithScores: sites.pagesWithScores,
          lastMetricsUpdate: sites.lastMetricsUpdate
        })
        .from(sites)
        .where(and(...baseConditions));

      // Get recent analysis trends
      const analysisTrends = await this.getAnalysisTrends(
        authenticatedReq.user.id,
        siteId as string,
        startDate
      );

      // Get top performing pages
      const topPages = await this.getTopPerformingPages(
        authenticatedReq.user.id,
        siteId as string,
        10
      );

      // Get improvement opportunities
      const improvements = await this.getImprovementOpportunities(
        authenticatedReq.user.id,
        siteId as string,
        5
      );

      this.success(res, {
        period,
        sitesOverview,
        analysisTrends,
        topPages,
        improvements,
        totalSites: sitesOverview.length,
        totalAnalyzedPages: sitesOverview.reduce((sum, site) => sum + (site.pagesWithScores || 0), 0)
      });

    } catch (error) {
      this.handleError(res, error, 'Analytics Dashboard');
    }
  };

  /**
   * Get detailed site analytics
   */
  getSiteAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { period = '30d' } = req.query;
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

      const periodDays = this.parsePeriod(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get page analytics
      const pageAnalytics = await db
        .select({
          id: pages.id,
          url: pages.url,
          title: pages.title,
          pageScore: pages.pageScore,
          lastAnalysisAt: pages.lastAnalysisAt,
          analysisCount: sql<number>`COUNT(${contentAnalysis.id})`,
          avgScore: sql<number>`AVG(${contentAnalysis.overallScore})`,
          latestAnalysis: sql<any>`
            JSON_BUILD_OBJECT(
              'overallScore', MAX(${contentAnalysis.overallScore}),
              'analyzedAt', MAX(${contentAnalysis.analyzedAt}),
              'llmModelUsed', MAX(${contentAnalysis.llmModelUsed})
            )
          `
        })
        .from(pages)
        .leftJoin(contentAnalysis, eq(pages.id, contentAnalysis.pageId))
        .where(
          and(
            eq(pages.siteId, siteId),
            gte(contentAnalysis.analyzedAt, startDate)
          )
        )
        .groupBy(pages.id, pages.url, pages.title, pages.pageScore, pages.lastAnalysisAt)
        .orderBy(desc(pages.pageScore));

      // Get analysis history
      const analysisHistory = await db
        .select({
          date: sql<string>`DATE(${contentAnalysis.analyzedAt})`,
          avgScore: sql<number>`AVG(${contentAnalysis.overallScore})`,
          count: sql<number>`COUNT(*)`
        })
        .from(contentAnalysis)
        .innerJoin(pages, eq(contentAnalysis.pageId, pages.id))
        .where(
          and(
            eq(pages.siteId, siteId),
            gte(contentAnalysis.analyzedAt, startDate)
          )
        )
        .groupBy(sql`DATE(${contentAnalysis.analyzedAt})`)
        .orderBy(sql`DATE(${contentAnalysis.analyzedAt})`);

      // Get score distribution
      const scoreDistribution = await db
        .select({
          scoreRange: sql<string>`
            CASE 
              WHEN ${contentAnalysis.overallScore} >= 90 THEN '90-100'
              WHEN ${contentAnalysis.overallScore} >= 80 THEN '80-89'
              WHEN ${contentAnalysis.overallScore} >= 70 THEN '70-79'
              WHEN ${contentAnalysis.overallScore} >= 60 THEN '60-69'
              ELSE '0-59'
            END
          `,
          count: sql<number>`COUNT(*)`
        })
        .from(contentAnalysis)
        .innerJoin(pages, eq(contentAnalysis.pageId, pages.id))
        .where(
          and(
            eq(pages.siteId, siteId),
            gte(contentAnalysis.analyzedAt, startDate)
          )
        )
        .groupBy(sql`
          CASE 
            WHEN ${contentAnalysis.overallScore} >= 90 THEN '90-100'
            WHEN ${contentAnalysis.overallScore} >= 80 THEN '80-89'
            WHEN ${contentAnalysis.overallScore} >= 70 THEN '70-79'
            WHEN ${contentAnalysis.overallScore} >= 60 THEN '60-69'
            ELSE '0-59'
          END
        `);

      this.success(res, {
        siteId,
        site: site[0],
        period,
        pageAnalytics,
        analysisHistory,
        scoreDistribution,
        summary: {
          totalPages: pageAnalytics.length,
          avgSiteScore: pageAnalytics.reduce((sum, p) => sum + (p.avgScore || 0), 0) / pageAnalytics.length || 0,
          totalAnalyses: pageAnalytics.reduce((sum, p) => sum + p.analysisCount, 0)
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Site Analytics');
    }
  };

  /**
   * Get comparison analytics between periods
   */
  getComparisonAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { period1 = '30d', period2 = '60d' } = req.query;
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

      const period1Days = this.parsePeriod(period1 as string);
      const period2Days = this.parsePeriod(period2 as string);

      const period1Start = new Date();
      period1Start.setDate(period1Start.getDate() - period1Days);

      const period2Start = new Date();
      period2Start.setDate(period2Start.getDate() - period2Days);
      const period2End = new Date();
      period2End.setDate(period2End.getDate() - period1Days);

      // Get metrics for both periods
      const period1Metrics = await this.getPeriodMetrics(siteId, period1Start, new Date());
      const period2Metrics = await this.getPeriodMetrics(siteId, period2Start, period2End);

      // Calculate changes
      const comparison = {
        avgScore: {
          current: period1Metrics.avgScore,
          previous: period2Metrics.avgScore,
          change: Number(period1Metrics.avgScore) - Number(period2Metrics.avgScore),
          changePercent: period2Metrics.avgScore ? 
            ((Number(period1Metrics.avgScore) - Number(period2Metrics.avgScore)) / Number(period2Metrics.avgScore)) * 100 : 0
        },
        totalAnalyses: {
          current: period1Metrics.totalAnalyses,
          previous: period2Metrics.totalAnalyses,
          change: period1Metrics.totalAnalyses - period2Metrics.totalAnalyses,
          changePercent: period2Metrics.totalAnalyses ? 
            ((period1Metrics.totalAnalyses - period2Metrics.totalAnalyses) / period2Metrics.totalAnalyses) * 100 : 0
        },
        pagesAnalyzed: {
          current: period1Metrics.pagesAnalyzed,
          previous: period2Metrics.pagesAnalyzed,
          change: period1Metrics.pagesAnalyzed - period2Metrics.pagesAnalyzed,
          changePercent: period2Metrics.pagesAnalyzed ? 
            ((period1Metrics.pagesAnalyzed - period2Metrics.pagesAnalyzed) / period2Metrics.pagesAnalyzed) * 100 : 0
        }
      };

      this.success(res, {
        siteId,
        period1,
        period2,
        comparison,
        period1Metrics,
        period2Metrics
      });

    } catch (error) {
      this.handleError(res, error, 'Comparison Analytics');
    }
  };

  // Helper methods
  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) return 30;

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }

  private async getAnalysisTrends(userId: string, siteId?: string, startDate?: Date) {
    const conditions = [eq(sites.userId, userId)];
    if (siteId) conditions.push(eq(sites.id, siteId));
    if (startDate) conditions.push(gte(contentAnalysis.analyzedAt, startDate));

    return await db
      .select({
        date: sql<string>`DATE(${contentAnalysis.analyzedAt})`,
        avgScore: sql<number>`AVG(${contentAnalysis.overallScore})`,
        count: sql<number>`COUNT(*)`
      })
      .from(contentAnalysis)
      .innerJoin(pages, eq(contentAnalysis.pageId, pages.id))
      .innerJoin(sites, eq(pages.siteId, sites.id))
      .where(and(...conditions))
      .groupBy(sql`DATE(${contentAnalysis.analyzedAt})`)
      .orderBy(sql`DATE(${contentAnalysis.analyzedAt})`)
      .limit(30);
  }

  private async getTopPerformingPages(userId: string, siteId?: string, limit: number = 10) {
    const conditions = [eq(sites.userId, userId)];
    if (siteId) conditions.push(eq(sites.id, siteId));

    return await db
      .select({
        pageId: pages.id,
        url: pages.url,
        title: pages.title,
        siteName: sites.name,
        avgScore: sql<number>`AVG(${contentAnalysis.overallScore})`,
        latestScore: sql<number>`MAX(${contentAnalysis.overallScore})`,
        analysisCount: sql<number>`COUNT(${contentAnalysis.id})`
      })
      .from(pages)
      .innerJoin(sites, eq(pages.siteId, sites.id))
      .innerJoin(contentAnalysis, eq(pages.id, contentAnalysis.pageId))
      .where(and(...conditions))
      .groupBy(pages.id, pages.url, pages.title, sites.name)
      .orderBy(sql`AVG(${contentAnalysis.overallScore}) DESC`)
      .limit(limit);
  }

  private async getImprovementOpportunities(userId: string, siteId?: string, limit: number = 5) {
    const conditions = [eq(sites.userId, userId)];
    if (siteId) conditions.push(eq(sites.id, siteId));

    return await db
      .select({
        pageId: pages.id,
        url: pages.url,
        title: pages.title,
        siteName: sites.name,
        latestScore: sql<number>`MAX(${contentAnalysis.overallScore})`,
        improvementPotential: sql<number>`100 - MAX(${contentAnalysis.overallScore})`
      })
      .from(pages)
      .innerJoin(sites, eq(pages.siteId, sites.id))
      .innerJoin(contentAnalysis, eq(pages.id, contentAnalysis.pageId))
      .where(and(...conditions))
      .groupBy(pages.id, pages.url, pages.title, sites.name)
      .having(sql`MAX(${contentAnalysis.overallScore}) < 80`)
      .orderBy(sql`100 - MAX(${contentAnalysis.overallScore}) DESC`)
      .limit(limit);
  }

  private async getPeriodMetrics(siteId: string, startDate: Date, endDate: Date) {
    const result = await db
      .select({
        avgScore: avg(contentAnalysis.overallScore),
        totalAnalyses: count(contentAnalysis.id),
        pagesAnalyzed: sql<number>`COUNT(DISTINCT ${contentAnalysis.pageId})`
      })
      .from(contentAnalysis)
      .innerJoin(pages, eq(contentAnalysis.pageId, pages.id))
      .where(
        and(
          eq(pages.siteId, siteId),
          gte(contentAnalysis.analyzedAt, startDate),
          lte(contentAnalysis.analyzedAt, endDate)
        )
      );

    return {
      avgScore: result[0]?.avgScore || 0,
      totalAnalyses: result[0]?.totalAnalyses || 0,
      pagesAnalyzed: result[0]?.pagesAnalyzed || 0
    };
  }
}