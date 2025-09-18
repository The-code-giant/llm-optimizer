import { Request, Response } from 'express';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { db } from '../../db/client';
import { sites, pages } from '../../db/schema';
import { eq, and, isNull, sql, desc, gte } from 'drizzle-orm';
import crypto from 'crypto';

export class TrackerControllerV2 extends BaseController {
  constructor() {
    super();
  }

  /**
   * Get tracker script for a site
   */
  getTrackerScript = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trackerId } = req.params;

      // Verify tracker exists
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.trackerId, trackerId),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Tracker not found', 404);
      }

      // Generate tracker script
      const trackerScript = this.generateTrackerScript(trackerId);

      // Set appropriate headers for JavaScript
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(trackerScript);

    } catch (error) {
      this.handleError(res, error, 'Get Tracker Script');
    }
  };

  /**
   * Get tracker configuration
   */
  getTrackerConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.id),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      const siteData = site[0];

      this.success(res, {
        siteId,
        trackerId: siteData.trackerId,
        trackerUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v2/tracker/${siteData.trackerId}/script.js`,
        installationCode: this.generateInstallationCode(siteData.trackerId),
        settings: siteData.settings || {},
        status: siteData.status
      });

    } catch (error) {
      this.handleError(res, error, 'Get Tracker Config');
    }
  };

  /**
   * Update tracker settings
   */
  updateTrackerSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { settings } = req.body;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.id),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Update settings
      const updatedSites = await db
        .update(sites)
        .set({
          settings: settings || {},
          updatedAt: new Date()
        })
        .where(eq(sites.id, siteId))
        .returning();

      this.success(res, {
        siteId,
        settings: updatedSites[0].settings,
        updatedAt: updatedSites[0].updatedAt
      }, 'Tracker settings updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Update Tracker Settings');
    }
  };

  /**
   * Regenerate tracker ID (for security)
   */
  regenerateTrackerId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.id),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Generate new tracker ID
      const newTrackerId = this.generateTrackerId();

      // Update site with new tracker ID
      const updatedSites = await db
        .update(sites)
        .set({
          trackerId: newTrackerId,
          updatedAt: new Date()
        })
        .where(eq(sites.id, siteId))
        .returning();

      this.success(res, {
        siteId,
        oldTrackerId: site[0].trackerId,
        newTrackerId,
        trackerUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v2/tracker/${newTrackerId}/script.js`,
        installationCode: this.generateInstallationCode(newTrackerId),
        updatedAt: updatedSites[0].updatedAt
      }, 'Tracker ID regenerated successfully');

    } catch (error) {
      this.handleError(res, error, 'Regenerate Tracker ID');
    }
  };

  /**
   * Track page view (called by the tracker script)
   */
  trackPageView = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trackerId } = req.params;
      const { url, title, referrer, userAgent } = req.body;

      if (!url) {
        return this.error(res, 'URL is required', 400);
      }

      // Verify tracker exists
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.trackerId, trackerId),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Invalid tracker', 404);
      }

      // Find or create page
      let page = await db
        .select()
        .from(pages)
        .where(
          and(
            eq(pages.siteId, site[0].id),
            eq(pages.url, url)
          )
        )
        .limit(1);

      if (page.length === 0) {
        // Create new page
        const newPages = await db
          .insert(pages)
          .values({
            siteId: site[0].id,
            url,
            title: title || null,
            lastScannedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        page = newPages;
      } else {
        // Update existing page with latest title if provided
        if (title && title !== page[0].title) {
          await db
            .update(pages)
            .set({
              title,
              lastScannedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(pages.id, page[0].id));
        }
      }

      // Return tracking pixel (1x1 transparent GIF)
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Length', pixel.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pixel);

    } catch (error) {
      // For tracking endpoints, we should fail silently to not break the user's site
      console.error('Track page view error:', error);
      
      // Return empty pixel even on error
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Length', pixel.length);
      res.send(pixel);
    }
  };

  /**
   * Get tracker analytics/stats
   */
  getTrackerStats = async (req: Request, res: Response): Promise<void> => {
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
            eq(sites.userId, authenticatedReq.user.id),
            isNull(sites.deletedAt)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Calculate period
      const periodDays = this.parsePeriod(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get page tracking stats
      const trackedPages = await db
        .select({
          id: pages.id,
          url: pages.url,
          title: pages.title,
          lastScannedAt: pages.lastScannedAt,
          createdAt: pages.createdAt
        })
        .from(pages)
        .where(
          and(
            eq(pages.siteId, siteId),
            gte(pages.lastScannedAt, startDate)
          )
        )
        .orderBy(desc(pages.lastScannedAt));

      this.success(res, {
        siteId,
        period,
        trackerId: site[0].trackerId,
        stats: {
          totalTrackedPages: trackedPages.length,
          recentActivity: trackedPages.filter(p => 
            p.lastScannedAt && new Date(p.lastScannedAt) >= startDate
          ).length,
          trackedPages: trackedPages.map(p => ({
            id: p.id,
            url: p.url,
            title: p.title,
            lastSeen: p.lastScannedAt,
            isNew: p.createdAt && new Date(p.createdAt) >= startDate
          }))
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Get Tracker Stats');
    }
  };

  // Helper methods
  private generateTrackerId(): string {
    return crypto.randomUUID();
  }

  private generateTrackerScript(trackerId: string): string {
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    return `
(function() {
  'use strict';
  
  var trackerId = '${trackerId}';
  var apiUrl = '${apiUrl}';
  var tracked = false;
  
  function trackPageView() {
    if (tracked) return;
    tracked = true;
    
    var data = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Use fetch if available, fallback to image beacon
    if (typeof fetch !== 'undefined') {
      fetch(apiUrl + '/api/v2/tracker/' + trackerId + '/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'cors'
      }).catch(function() {
        // Fallback to image beacon on fetch failure
        var img = new Image();
        img.src = apiUrl + '/api/v2/tracker/' + trackerId + '/pixel.gif?' + 
                  'url=' + encodeURIComponent(data.url) + 
                  '&title=' + encodeURIComponent(data.title);
      });
    } else {
      // Fallback for older browsers
      var img = new Image();
      img.src = apiUrl + '/api/v2/tracker/' + trackerId + '/pixel.gif?' + 
                'url=' + encodeURIComponent(data.url) + 
                '&title=' + encodeURIComponent(data.title);
    }
  }
  
  // Track initial page view
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }
  
  // Track SPA navigation
  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(function() {
      tracked = false;
      trackPageView();
    }, 100);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(function() {
      tracked = false;
      trackPageView();
    }, 100);
  };
  
  window.addEventListener('popstate', function() {
    setTimeout(function() {
      tracked = false;
      trackPageView();
    }, 100);
  });
})();
    `.trim();
  }

  private generateInstallationCode(trackerId: string): string {
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    return `<!-- Cleversearch Analytics -->
<script async src="${apiUrl}/api/v2/tracker/${trackerId}/script.js"></script>
<!-- End Cleversearch Analytics -->`;
  }

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
}