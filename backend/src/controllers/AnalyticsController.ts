import { Request, Response } from 'express';
import { db } from '../db/client';
import { sites, pageAnalytics, trackerData, contentDeployments } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { UUIDSchema } from '../types/dtos';

export class AnalyticsController extends BaseController {
  /**
   * Get basic analytics overview for a site
   */
  public getOverview = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;
    const timeRange = (req.query.timeRange as string) || '7d';

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    try {
      // Check site ownership
      const siteArr = await db
        .select()
        .from(sites)
        .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
        .limit(1);

      const site = siteArr[0];
      if (!site) {
        return this.sendError(res, 'Site not found', 404);
      }

      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get page analytics data
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
          visitDate: pageAnalytics.visitDate,
          createdAt: pageAnalytics.createdAt
        })
        .from(pageAnalytics)
        .where(and(
          eq(pageAnalytics.siteId, siteId),
          sql`${pageAnalytics.createdAt} >= ${startDate}`
        ));

      // Calculate overview metrics
      const totalViews = analyticsData.reduce((sum, record) => sum + (record.pageViews || 0), 0);
      const totalUniqueVisitors = analyticsData.reduce((sum, record) => sum + (record.uniqueVisitors || 0), 0);
      const avgLoadTime = analyticsData.length > 0 
        ? Math.round(analyticsData.reduce((sum, record) => sum + (record.loadTimeMs || 0), 0) / analyticsData.length)
        : 0;

      // Get content deployments count (only active deployments)
      const [deploymentsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contentDeployments)
        .where(and(
          eq(contentDeployments.pageId, sql`ANY(
            SELECT id FROM pages WHERE site_id = ${siteId}
          )`),
          eq(contentDeployments.status, 'deployed'),
          eq(contentDeployments.isActive, 1)
        ));

      // Format top pages
      const topPages = analyticsData
        .sort((a, b) => (b.pageViews || 0) - (a.pageViews || 0))
        .slice(0, 10)
        .map(record => ({
          url: record.pageUrl || '',
          views: record.pageViews || 0,
          avgLoadTime: record.loadTimeMs || 0,
          bounceRate: record.bounceRate || 0,
          hasDeployedContent: record.contentInjected === 1,
          lastOptimized: record.createdAt?.toISOString()
        }));

      // Format time series data (group by date)
      const timeSeriesMap = new Map();
      analyticsData.forEach(record => {
        const date = record.visitDate || record.createdAt?.toISOString().split('T')[0] || '';
        if (!timeSeriesMap.has(date)) {
          timeSeriesMap.set(date, { date, views: 0, uniqueVisitors: 0, loadTimes: [] });
        }
        const entry = timeSeriesMap.get(date);
        entry.views += record.pageViews || 0;
        entry.uniqueVisitors += record.uniqueVisitors || 0;
        if (record.loadTimeMs) entry.loadTimes.push(record.loadTimeMs);
      });

      const timeSeriesData = Array.from(timeSeriesMap.values()).map(entry => ({
        date: entry.date,
        views: entry.views,
        uniqueVisitors: entry.uniqueVisitors,
        avgLoadTime: entry.loadTimes.length > 0 
          ? Math.round(entry.loadTimes.reduce((sum: number, time: number) => sum + time, 0) / entry.loadTimes.length)
          : 0
      }));

      // Return analytics overview data
      this.sendSuccess(res, {
        overview: {
          totalViews,
          uniqueVisitors: totalUniqueVisitors,
          avgLoadTime,
          contentDeployments: deploymentsCount?.count || 0,
          trendsPercentage: {
            views: 0, // Would need historical data to calculate trends
            visitors: 0,
            loadTime: 0,
            deployments: 0
          }
        },
        topPages,
        contentPerformance: [], // Will be implemented separately
        recentActivity: [], // Will be implemented separately
        timeSeriesData,
        timeRange
      });

    } catch (error) {
      console.error('Error getting analytics overview:', error);
      return this.sendError(res, 'Failed to fetch analytics overview', 500);
    }
  });

  /**
   * Get demographics analytics for a site
   */
  public getDemographics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;
    const timeRange = (req.query.timeRange as string) || '7d';

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    try {
      // Check site ownership
      const siteArr = await db
        .select()
        .from(sites)
        .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
        .limit(1);

      if (siteArr.length === 0) {
        return this.sendError(res, 'Site not found', 404);
      }

      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get tracker data for demographics
      const trackerEvents = await db
        .select({
          userAgent: trackerData.userAgent,
          ipAddress: trackerData.ipAddress,
          referrer: trackerData.referrer,
          eventType: trackerData.eventType,
          timestamp: trackerData.timestamp,
          sessionId: trackerData.sessionId,
          anonymousUserId: trackerData.anonymousUserId
        })
        .from(trackerData)
        .where(and(
          eq(trackerData.siteId, siteId),
          sql`${trackerData.timestamp} >= ${startDate}`
        ));

      // Process demographics data by unique sessions
      const deviceBreakdown: Record<string, number> = {};
      const browserBreakdown: Record<string, number> = {};
      const trafficSources: Record<string, number> = {};
      const uniqueSessions = new Map<string, {
        userAgent: string;
        referrer: string;
        sessionId: string;
      }>();

      // First, collect unique sessions and their properties
      trackerEvents.forEach(event => {
        if (event.sessionId && !uniqueSessions.has(event.sessionId)) {
          uniqueSessions.set(event.sessionId, {
            userAgent: event.userAgent || '',
            referrer: event.referrer || '',
            sessionId: event.sessionId
          });
        }
      });

      // Now process demographics based on unique sessions
      uniqueSessions.forEach(session => {
        // Simple device detection from user agent
        const ua = session.userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          deviceBreakdown['Mobile'] = (deviceBreakdown['Mobile'] || 0) + 1;
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          deviceBreakdown['Tablet'] = (deviceBreakdown['Tablet'] || 0) + 1;
        } else {
          deviceBreakdown['Desktop'] = (deviceBreakdown['Desktop'] || 0) + 1;
        }

        // Simple browser detection
        if (ua.includes('chrome')) {
          browserBreakdown['Chrome'] = (browserBreakdown['Chrome'] || 0) + 1;
        } else if (ua.includes('firefox')) {
          browserBreakdown['Firefox'] = (browserBreakdown['Firefox'] || 0) + 1;
        } else if (ua.includes('safari')) {
          browserBreakdown['Safari'] = (browserBreakdown['Safari'] || 0) + 1;
        } else {
          browserBreakdown['Other'] = (browserBreakdown['Other'] || 0) + 1;
        }

        // Traffic sources from referrer
        if (session.referrer) {
          try {
            const refUrl = new URL(session.referrer);
            const domain = refUrl.hostname;
            trafficSources[domain] = (trafficSources[domain] || 0) + 1;
          } catch {
            trafficSources['Direct'] = (trafficSources['Direct'] || 0) + 1;
          }
        } else {
          trafficSources['Direct'] = (trafficSources['Direct'] || 0) + 1;
        }
      });

      const totalSessions = uniqueSessions.size;
      const trafficSourcesArray = Object.entries(trafficSources).map(([source, count]) => ({
        source,
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
      }));

      this.sendSuccess(res, {
        trafficSources: trafficSourcesArray,
        deviceBreakdown,
        browserBreakdown,
        geographicData: [], // Would need IP geolocation service
        timeRange,
        totalSessions
      });

    } catch (error) {
      console.error('Error getting demographics:', error);
      return this.sendError(res, 'Failed to fetch demographics', 500);
    }
  });

  /**
   * Get page performance analytics for a site
   */
  public getPagePerformance = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;
    const timeRange = (req.query.timeRange as string) || '7d';

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    try {
      // Check site ownership
      const siteArr = await db
        .select()
        .from(sites)
        .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))
        .limit(1);

      if (siteArr.length === 0) {
        return this.sendError(res, 'Site not found', 404);
      }

      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get page performance data
      const pagePerformance = await db
        .select({
          pageUrl: pageAnalytics.pageUrl,
          pageViews: pageAnalytics.pageViews,
          uniqueVisitors: pageAnalytics.uniqueVisitors,
          bounceRate: pageAnalytics.bounceRate,
          avgSessionDuration: pageAnalytics.avgSessionDuration,
          loadTimeMs: pageAnalytics.loadTimeMs,
          contentInjected: pageAnalytics.contentInjected
        })
        .from(pageAnalytics)
        .where(and(
          eq(pageAnalytics.siteId, siteId),
          sql`${pageAnalytics.createdAt} >= ${startDate}`
        ))
        .orderBy(desc(pageAnalytics.pageViews))
        .limit(20);

      // Get overall performance metrics
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

      // Calculate summary metrics for frontend compatibility
      const metrics = performanceMetrics[0] || {
        totalViews: 0,
        totalUniqueVisitors: 0,
        avgBounceRate: 0,
        avgSessionDuration: 0,
        avgLoadTime: 0
      };

      this.sendSuccess(res, {
        pagePerformance: pagePerformance.map(page => ({
          url: page.pageUrl || '',
          views: page.pageViews || 0,
          uniqueVisitors: page.uniqueVisitors || 0,
          bounceRate: page.bounceRate || 0,
          avgSessionDuration: page.avgSessionDuration || 0,
          loadTimeMs: page.loadTimeMs || 0,
          hasOptimizedContent: page.contentInjected === 1,
          performanceScore: 85, // Mock score for now
          loadTimeScore: page.loadTimeMs ? Math.max(0, 100 - (page.loadTimeMs / 10)) : 0,
          bounceRateScore: page.bounceRate ? Math.max(0, 100 - (page.bounceRate * 100)) : 0,
          engagementScore: page.avgSessionDuration ? Math.min(100, (page.avgSessionDuration / 60) * 20) : 0
        })),
        summary: {
          totalPages: pagePerformance.length,
          totalViews: metrics.totalViews || 0,
          totalUniqueVisitors: metrics.totalUniqueVisitors || 0,
          avgBounceRate: metrics.avgBounceRate || 0,
          avgSessionDuration: metrics.avgSessionDuration || 0,
          avgLoadTime: metrics.avgLoadTime || 0,
          avgPerformanceScore: 85, // Mock average performance score
          optimizedPages: pagePerformance.filter(p => p.contentInjected === 1).length
        },
        contentOptimizations: [], // Mock empty for now
        performanceMetrics: metrics,
        timeRange
      });

    } catch (error) {
      console.error('Error getting page performance:', error);
      return this.sendError(res, 'Failed to fetch page performance', 500);
    }
  });
}
