import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, contentDeployments, trackerData } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import cache from '../utils/cache';
import { BaseController } from './BaseController';
import { 
  TrackerDataSchema, 
  TrackerContentQuerySchema,
  UUIDSchema 
} from '../types/dtos';

export class TrackerController extends BaseController {
  /**
   * Collect tracking data from client-side script
   */
  public collectData = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const trackerId = req.params.trackerId;

    // Validate trackerId
    const trackerIdValidation = UUIDSchema.safeParse(trackerId);
    if (!trackerIdValidation.success) {
      return this.sendError(res, 'Invalid tracker ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(TrackerDataSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid tracking data', 400, bodyValidation.errors);
    }

    const trackingData = bodyValidation.data!;

    // Find site by trackerId
    const siteArr = await db
      .select()
      .from(sites)
      .where(eq(sites.trackerId, trackerId))
      .limit(1);

    const site = siteArr[0];
    if (!site) {
      // Return 200 to avoid breaking the tracker script, but log the issue
      console.warn(`Tracker ID not found: ${trackerId}`);
      res.status(200).json({ success: true, message: 'Data received' });
      return;
    }

    try {
      // Extract additional metadata from request
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      const referrer = req.headers['referer'] || '';

      // Store tracking data
      await db.insert(trackerData).values({
        siteId: site.id,
        pageUrl: trackingData.pageUrl,
        eventType: trackingData.eventType,
        timestamp: trackingData.timestamp ? new Date(trackingData.timestamp) : new Date(),
        sessionId: trackingData.sessionId,
        anonymousUserId: trackingData.anonymousUserId,
        eventData: trackingData.eventData || {},
        userAgent,
        ipAddress: ipAddress.substring(0, 45), // Truncate to fit column length
        referrer: referrer.substring(0, 1024) // Truncate to fit column length
      });

      // Return success response
      res.status(200).json({ success: true, message: 'Data received' });
      return;
    } catch (error) {
      console.error('Error storing tracking data:', error);
      // Still return 200 to avoid breaking the tracker
      res.status(200).json({ success: true, message: 'Data received' });
      return;
    }
  });

  /**
   * Get injected content for a page
   */
  public getContent = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const trackerId = req.params.trackerId;

    // Validate trackerId
    const trackerIdValidation = UUIDSchema.safeParse(trackerId);
    if (!trackerIdValidation.success) {
      res.status(200).json([]); // Return empty array for invalid tracker ID
      return;
    }

    // Validate query parameters
    const queryValidation = this.validateQuery(TrackerContentQuerySchema, req.query);
    if (!queryValidation.isValid) {
      res.status(200).json([]); // Return empty array for invalid query
      return;
    }

    const { pageUrl } = queryValidation.data!;

    try {
      console.log(`🔍 Tracker content request: trackerId=${trackerId}, pageUrl=${pageUrl}`);
      
      // Skip cache for debugging
      // const cachedContent = await cache.getTrackerContent(trackerId, pageUrl);
      // if (cachedContent) {
      //   console.log(`📦 Returning cached content: ${cachedContent.length} items`);
      //   res.status(200).json(cachedContent);
      //   return;
      // }

      // Find site by trackerId
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.trackerId, trackerId))
        .limit(1);

      const site = siteArr[0];
      if (!site) {
        console.log(`❌ Site not found for trackerId: ${trackerId}`);
        const emptyResponse: any[] = [];
        await cache.setTrackerContent(trackerId, pageUrl, emptyResponse);
        res.status(200).json(emptyResponse);
        return;
      }

      console.log(`✅ Found site: ${site.name} (${site.id})`);

      // Find the page for this site and URL (handle trailing slash variations)
      let pageArr = await db
        .select()
        .from(pages)
        .where(and(eq(pages.siteId, site.id), eq(pages.url, pageUrl)))
        .limit(1);

      let page = pageArr[0];
      
      // If not found, try without trailing slash
      if (!page && pageUrl.endsWith('/')) {
        const urlWithoutSlash = pageUrl.slice(0, -1);
        pageArr = await db
          .select()
          .from(pages)
          .where(and(eq(pages.siteId, site.id), eq(pages.url, urlWithoutSlash)))
          .limit(1);
        page = pageArr[0];
        console.log(`🔄 Trying without trailing slash: ${urlWithoutSlash}`);
      }
      
      // If still not found, try with trailing slash
      if (!page && !pageUrl.endsWith('/')) {
        const urlWithSlash = pageUrl + '/';
        pageArr = await db
          .select()
          .from(pages)
          .where(and(eq(pages.siteId, site.id), eq(pages.url, urlWithSlash)))
          .limit(1);
        page = pageArr[0];
        console.log(`🔄 Trying with trailing slash: ${urlWithSlash}`);
      }

      if (!page) {
        console.log(`❌ Page not found for URL: ${pageUrl} in site: ${site.id}`);
        // Let's also check all pages for this site to see what URLs exist
        const allPages = await db.select().from(pages).where(eq(pages.siteId, site.id));
        console.log(`📄 Available pages for this site:`, allPages.map(p => p.url));
        
        const emptyResponse: any[] = [];
        // Cache empty response for 1 minute to reduce DB load
        await cache.setTrackerContent(trackerId, pageUrl, emptyResponse);
        res.status(200).json(emptyResponse);
        return;
      }

      console.log(`✅ Found page: ${page.url} (${page.id})`);

      // Find active deployed content for this page
      const content = await db
        .select({ 
          id: contentDeployments.id, 
          type: contentDeployments.sectionType, 
          content: contentDeployments.deployedContent 
        })
        .from(contentDeployments)
        .where(eq(contentDeployments.pageId, page.id));

      console.log(`📝 Found ${content.length} content deployments for page ${page.id}`);
      content.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.type}: ${item.content.substring(0, 50)}...`);
      });

      // Cache the response for 5 minutes
      await cache.setTrackerContent(trackerId, pageUrl, content);
      
      console.log(`✅ Returning ${content.length} content items`);
      res.status(200).json(content);
    } catch (error) {
      console.error('Error retrieving tracker content:', error);
      // Return empty array to avoid breaking the tracker
      res.status(200).json([]);
    }
  });

  /**
   * Get site by tracker ID (helper method for other services)
   */
  public static async getSiteByTrackerId(trackerId: string) {
    try {
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.trackerId, trackerId))
        .limit(1);

      return siteArr[0] || null;
    } catch (error) {
      console.error('Error fetching site by tracker ID:', error);
      return null;
    }
  }

  /**
   * Validate tracker ID and get associated site
   */
  private async validateTrackerAndGetSite(trackerId: string) {
    // Validate trackerId format
    const trackerIdValidation = UUIDSchema.safeParse(trackerId);
    if (!trackerIdValidation.success) {
      return null;
    }

    // Find site by trackerId
    return await TrackerController.getSiteByTrackerId(trackerId);
  }

  /**
   * Normalize URL for consistent caching and comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash and convert to lowercase
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`.replace(/\/$/, '').toLowerCase();
    } catch {
      return url.toLowerCase().replace(/\/$/, '');
    }
  }
}
