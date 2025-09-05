import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, pageContent, trackerData, pageAnalytics } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import cache from '../utils/cache';
import { trackerRateLimit, createTrackerSpecificRateLimit } from '../middleware/rateLimit';

const router = Router();

const trackingDataSchema = z.object({
  pageUrl: z.string().url(),
  eventType: z.string().min(1),
  timestamp: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  screenWidth: z.number().optional(),
});

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to normalize URL
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch (error) {
    return url;
  }
}

// Enhanced site lookup with caching
async function getSiteByTrackerId(trackerId: string): Promise<any> {
  // Try cache first
  const cacheKey = `site:tracker:${trackerId}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  // Fetch from database
  const siteArr = await db.select().from(sites).where(eq(sites.trackerId, trackerId)).limit(1);
  const site = siteArr[0];
  
  if (site) {
    // Cache for 30 minutes (site config changes infrequently)
    await cache.set(cacheKey, site, { ttl: 1800 });
  }
  
  return site;
}

/**
 * @openapi
 * /api/v1/tracker/{trackerId}/data:
 *   post:
 *     summary: Receive tracking data from client-side script
 *     tags: [Tracker]
 *     parameters:
 *       - in: path
 *         name: trackerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pageUrl, eventType]
 *             properties:
 *               pageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/page
 *               eventType:
 *                 type: string
 *                 example: pageview
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-07-01T12:00:00Z
 *               referrer:
 *                 type: string
 *                 example: https://google.com
 *               userAgent:
 *                 type: string
 *                 example: Mozilla/5.0
 *               screenWidth:
 *                 type: number
 *                 example: 1920
 *     responses:
 *       204:
 *         description: Data received
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Site not found
 *       429:
 *         description: Rate limit exceeded
 */
// Receive tracking data - Enhanced with rate limiting and event buffering
router.post('/tracker/:trackerId/data', 
  trackerRateLimit, // Rate limiting middleware
  createTrackerSpecificRateLimit(500), // Tracker-specific rate limiting
  async (req, res: Response, next: NextFunction) => {
    try {
      const parse = trackingDataSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ message: 'Invalid input', errors: parse.error.errors });
        return;
      }
      
      const { trackerId } = req.params;
      const site = await getSiteByTrackerId(trackerId);
      
      if (!site) {
        res.status(404).json({ message: 'Site not found' });
        return;
      }

      // Buffer tracking event for batch processing (performance optimization)
      const eventData = {
        siteId: site.id,
        trackerId,
        pageUrl: parse.data.pageUrl,
        eventType: parse.data.eventType,
        timestamp: parse.data.timestamp || new Date().toISOString(),
        referrer: parse.data.referrer,
        userAgent: parse.data.userAgent || req.headers['user-agent'],
        screenWidth: parse.data.screenWidth,
        ipAddress: req.ip || req.connection.remoteAddress,
        sessionId: req.body.sessionId && isValidUUID(req.body.sessionId) ? req.body.sessionId : null,
        anonymousUserId: req.body.anonymousUserId && isValidUUID(req.body.anonymousUserId) ? req.body.anonymousUserId : null,
      };

      // Buffer the event instead of immediate database write for better performance
      await cache.bufferTrackerEvent(site.id, eventData);

      // Respond immediately to keep tracker fast
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/v1/tracker/{trackerId}/content:
 *   get:
 *     summary: Fetch injected content for a page (Enhanced with Redis caching)
 *     tags: [Tracker]
 *     parameters:
 *       - in: path
 *         name: trackerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageUrl
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *     responses:
 *       200:
 *         description: List of injected content for the page
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InjectedContent'
 *       400:
 *         description: Missing or invalid pageUrl
 *       404:
 *         description: Site not found
 *       429:
 *         description: Rate limit exceeded
 */
// Fetch injected content for a page - Enhanced with Redis caching
router.get('/tracker/:trackerId/content', 
  trackerRateLimit, // Rate limiting middleware
  async (req, res: Response, next: NextFunction) => {
    try {
      const { trackerId } = req.params;
      const { pageUrl } = req.query;
      
      if (typeof pageUrl !== 'string') {
        res.status(400).json({ message: 'Missing or invalid pageUrl' });
        return;
      }

      // Try Redis cache first (HIGHEST PRIORITY FOR PERFORMANCE)
      const cachedContent = await cache.getTrackerContent(trackerId, pageUrl);
      if (cachedContent) {
        res.json(cachedContent);
        return;
      }

      const site = await getSiteByTrackerId(trackerId);
      if (!site) {
        res.status(404).json({ message: 'Site not found' });
        return;
      }

      // Find the page for this site and URL
      const pageArr = await db.select().from(pages).where(and(eq(pages.siteId, site.id), eq(pages.url, pageUrl))).limit(1);
      const page = pageArr[0];
      
      if (!page) {
        const emptyResponse: any[] = [];
        // Cache empty response for 1 minute to reduce DB load
        await cache.setTrackerContent(trackerId, pageUrl, emptyResponse);
        res.json(emptyResponse);
        return;
      }

      // Find active deployed content for this page
      const content = await db
        .select({ 
          id: pageContent.id, 
          type: pageContent.contentType, 
          content: pageContent.optimizedContent 
        })
        .from(pageContent)
        .where(and(eq(pageContent.pageId, page.id), eq(pageContent.isActive, 1)));

      // Cache the response for 5 minutes
      await cache.setTrackerContent(trackerId, pageUrl, content);
      
      res.json(content);
    } catch (err) {
      next(err);
    }
  }
);

// Content retrieval endpoint for JavaScript tracker - Enhanced with Redis caching
// POST /tracker/content
router.post('/tracker/content', 
  trackerRateLimit,
  async (req: Request, res: Response) => {
    try {
      console.log('Tracker content request:', { body: req.body, headers: req.headers });
      const { url, siteId, userAgent, referrer, timestamp } = req.body;
      
      // 1. Validate required fields
      if (!url || !siteId) {
        res.status(400).json({ error: 'URL and siteId are required' });
        return;
      }

      // 2. Try Redis cache first (HIGHEST PRIORITY FOR PERFORMANCE)
      const cachedContent = await cache.getTrackerContent(siteId, url);
      if (cachedContent) {
        // Track cache hit but don't block response
        cache.bufferTrackerEvent(siteId, {
          eventType: 'content_request',
          pageUrl: url,
          userAgent: userAgent || 'unknown',
          referrer: referrer || '',
          contentFound: cachedContent.content?.length > 0,
          fromCache: true,
          timestamp: timestamp || new Date().toISOString()
        });
        
        res.json(cachedContent);
        return;
      }

      // 3. Authenticate site using tracker_id (with caching)
      console.log('Looking up site with trackerId:', siteId);
      const site = await getSiteByTrackerId(siteId);
      console.log('Site lookup result:', site ? { id: site.id, name: site.name, trackerId: site.trackerId } : 'null');
      if (!site) {
        res.status(404).json({ error: 'Site not found' });
        return;
      }

      // 4. Verify URL belongs to site domain (basic security) - allow localhost for development
      const normalizedUrl = normalizeUrl(url);
      const siteUrl = new URL(site.url);
      const requestUrl = new URL(url);
      
      // Allow localhost for development/testing
      const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
      const siteIsLocalhost = siteUrl.hostname === 'localhost' || siteUrl.hostname === '127.0.0.1';
      
      if (!isLocalhost && !siteIsLocalhost && siteUrl.hostname !== requestUrl.hostname) {
        res.status(403).json({ error: 'URL does not match site domain' });
        return;
      }

      // 5. Get deployed content for this URL
      const content = await db
        .select({
          contentType: pageContent.contentType,
          optimizedContent: pageContent.optimizedContent,
          metadata: pageContent.metadata
        })
        .from(pageContent)
        .where(
          and(
            eq(pageContent.pageUrl, normalizedUrl),
            eq(pageContent.isActive, 1)
          )
        );

      // 6. Format content for script consumption
      const formattedContent = content.map(item => ({
        type: item.contentType,
        data: {
          optimized: item.optimizedContent,
          ...(item.metadata as Record<string, any> || {})
        }
      }));

      const response = { 
        success: true,
        content: formattedContent,
        siteId: site.id
      };

      // 7. Cache the response for 5 minutes (content changes infrequently)
      await cache.setTrackerContent(siteId, url, response);

      // 8. Buffer tracking event for batch processing
      await cache.bufferTrackerEvent(site.id, {
        eventType: 'content_request',
        pageUrl: normalizedUrl,
        userAgent: userAgent || 'unknown',
        referrer: referrer || '',
        contentFound: content.length > 0,
        fromCache: false,
        timestamp: timestamp || new Date().toISOString()
      });

      res.json(response);

    } catch (error) {
      console.error('Content retrieval error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
);

// Event tracking endpoint for JavaScript tracker - Enhanced with event buffering
// POST /tracker/event
router.post('/tracker/event', 
  trackerRateLimit,
  async (req, res) => {
    try {
      console.log('Tracker event request:', { body: req.body, headers: req.headers });
      const { siteId, eventType, eventData, sessionId, url, timestamp } = req.body;
      
      // 1. Validate required fields
      if (!siteId || !eventType || !url) {
        res.status(400).json({ error: 'siteId, eventType, and url are required' });
        return;
      }

      // 2. Authenticate site using tracker_id (with caching)
      console.log('Looking up site with trackerId for event:', siteId);
      const site = await getSiteByTrackerId(siteId);
      console.log('Site lookup result for event:', site ? { id: site.id, name: site.name, trackerId: site.trackerId } : 'null');
      if (!site) {
        res.status(404).json({ error: 'Site not found' });
        return;
      }

      const normalizedUrl = normalizeUrl(url);

      // 3. Buffer tracking event for batch processing (performance optimization)
      const bufferedEvent = {
        siteId: site.id,
        pageUrl: normalizedUrl,
        eventType,
        eventData: eventData || {},
        sessionId: sessionId && isValidUUID(sessionId) ? sessionId : null,
        anonymousUserId: req.body.anonymousUserId && isValidUUID(req.body.anonymousUserId) ? req.body.anonymousUserId : null,
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        referrer: req.headers.referer || '',
        timestamp: timestamp ? new Date(timestamp) : new Date()
      };

      await cache.bufferTrackerEvent(site.id, bufferedEvent);

      // 4. For page views, update analytics immediately (critical metrics)
      if (eventType === 'page_view') {
        // Use async operation to not block response
        setImmediate(() => updatePageAnalytics(site.id, normalizedUrl, eventData || {}));
      }

      res.status(200).json({ success: true });

    } catch (error) {
      console.error('Event tracking error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
);

// Update page analytics (helper function) - Enhanced with error handling
async function updatePageAnalytics(siteId: string, pageUrl: string, eventData: any) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if analytics record exists for today
    const existingAnalytics = await db
      .select()
      .from(pageAnalytics)
      .where(
        and(
          eq(pageAnalytics.siteId, siteId),
          eq(pageAnalytics.pageUrl, pageUrl),
          eq(pageAnalytics.visitDate, today)
        )
      );

    const loadTime = eventData.loadTime || 0;
    const contentInjected = eventData.contentInjected || false;

    if (existingAnalytics.length > 0) {
      // Update existing record
      const current = existingAnalytics[0];
      const newPageViews = (current.pageViews || 0) + 1;
      const newAvgLoadTime = current.loadTimeMs 
        ? Math.round((current.loadTimeMs + loadTime) / 2)
        : loadTime;

      await db
        .update(pageAnalytics)
        .set({
          pageViews: newPageViews,
          loadTimeMs: newAvgLoadTime,
          contentInjected: contentInjected ? 1 : current.contentInjected,
          updatedAt: new Date()
        })
        .where(eq(pageAnalytics.id, current.id));
    } else {
      // Create new analytics record
      await db.insert(pageAnalytics).values({
        siteId,
        pageUrl,
        visitDate: today,
        pageViews: 1,
        uniqueVisitors: 1,
        loadTimeMs: loadTime,
        contentInjected: contentInjected ? 1 : 0,
        contentTypesInjected: eventData.contentTypes || []
      });
    }
  } catch (error) {
    console.error('Analytics update error:', error);
    // Don't throw error - analytics shouldn't break tracking
  }
}

// Get tracking script by tracker ID (public endpoint)
// GET /tracker/script/:trackerId
router.get('/script/:trackerId', 
  trackerRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trackerId } = req.params;
      
      // Find site by tracker ID (with caching)
      const site = await getSiteByTrackerId(trackerId);
      if (!site) {
        res.status(404).json({ error: 'Site not found' });
        return;
      }

      // Generate the API base URL
      const apiBase = process.env.NODE_ENV === 'production' 
        ? process.env.API_URL || 'https://backend.cleversearch.ai'
        : 'http://localhost:3001';

      // Generate Next.js Script component with simplified configuration
      const nextScriptFormat = `<Script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config={JSON.stringify({
    "SITE_ID": "${site.trackerId}"
  })}
  async
  strategy="beforeInteractive"
/>`;

      // Also provide legacy inline script for non-Next.js users
      const legacyScriptHtml = `<!-- Cleversearch Tracking Script -->
<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID":"${site.trackerId}"}'
  async
  defer
></script>`;

      const response = {
        siteId: site.id,
        siteName: site.name,
        trackerId: site.trackerId,
        nextJsScript: nextScriptFormat,
        scriptHtml: legacyScriptHtml,
        config: {
          SITE_ID: site.trackerId
        },
        instructions: {
          nextJs: "For Next.js projects, copy the 'nextJsScript' code and paste it in your component. Make sure to import Script from 'next/script'.",
          legacy: "For other frameworks, copy the 'scriptHtml' code and paste it in your website's <head> section.",
          verification: "After installation, visit your website and check the browser console for 'Cleversearch' messages to verify the script is working.",
          support: "If you need help, contact our support team."
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Tracker script generation error:', error);
      next(error);
    }
  }
);

export default router;
