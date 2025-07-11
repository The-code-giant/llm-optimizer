import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, injectedContent, pages, pageInjectedContent, pageContent, trackerData, pageAnalytics } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

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
 */
// Receive tracking data
router.post('/tracker/:trackerId/data', async (req, res: Response, next: NextFunction) => {
  try {
    const parse = trackingDataSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Invalid input', errors: parse.error.errors });
      return;
    }
    const { trackerId } = req.params;
    const siteArr = await db.select().from(sites).where(eq(sites.trackerId, trackerId)).limit(1);
    const site = siteArr[0];
    if (!site) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    // TODO: Store tracking data (MVP: skip or stub)
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/tracker/{trackerId}/content:
 *   get:
 *     summary: Fetch injected content for a page
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
 */
// Fetch injected content for a page
router.get('/tracker/:trackerId/content', async (req, res: Response, next: NextFunction) => {
  try {
    const { trackerId } = req.params;
    const { pageUrl } = req.query;
    if (typeof pageUrl !== 'string') {
      res.status(400).json({ message: 'Missing or invalid pageUrl' });
      return;
    }
    const siteArr = await db.select().from(sites).where(eq(sites.trackerId, trackerId)).limit(1);
    const site = siteArr[0];
    if (!site) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    // Find the page for this site and URL
    const pageArr = await db.select().from(pages).where(and(eq(pages.siteId, site.id), eq(pages.url, pageUrl))).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.json([]);
      return;
    }
    // Find active injected content for this page
    const content = await db
      .select({ id: injectedContent.id, type: injectedContent.type, content: injectedContent.content })
      .from(pageInjectedContent)
      .leftJoin(injectedContent, eq(pageInjectedContent.injectedContentId, injectedContent.id))
      .where(and(eq(pageInjectedContent.pageId, page.id), eq(injectedContent.status, 'active')));
    res.json(content);
  } catch (err) {
    next(err);
  }
});

// Content retrieval endpoint for JavaScript tracker
// POST /tracker/content
router.post('/content', async (req: Request, res: Response) => {
  try {
    const { url, siteId, userAgent, referrer, timestamp } = req.body;
    
    // 1. Validate required fields
    if (!url || !siteId) {
      res.status(400).json({ error: 'URL and siteId are required' });
      return;
    }

    // 2. Authenticate site using tracker_id
    const site = await db.select().from(sites).where(eq(sites.trackerId, siteId));
    if (!site.length) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    // 3. Verify URL belongs to site domain (basic security) - allow localhost for development
    const normalizedUrl = normalizeUrl(url);
    const siteUrl = new URL(site[0].url);
    const requestUrl = new URL(url);
    
    // Allow localhost for development/testing
    const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
    const siteIsLocalhost = siteUrl.hostname === 'localhost' || siteUrl.hostname === '127.0.0.1';
    
    if (!isLocalhost && !siteIsLocalhost && siteUrl.hostname !== requestUrl.hostname) {
      res.status(403).json({ error: 'URL does not match site domain' });
      return;
    }

    // 4. Get deployed content for this URL
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

    // 5. Track the content request
    await db.insert(trackerData).values({
      siteId: site[0].id,
      pageUrl: normalizedUrl,
      eventType: 'content_request',
      eventData: {
        userAgent: userAgent || 'unknown',
        referrer: referrer || '',
        contentFound: content.length > 0,
        timestamp: timestamp || new Date().toISOString()
      },
      userAgent: userAgent || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      referrer: referrer || '',
      sessionId: req.body.sessionId && isValidUUID(req.body.sessionId) ? req.body.sessionId : null,
      anonymousUserId: req.body.anonymousUserId && isValidUUID(req.body.anonymousUserId) ? req.body.anonymousUserId : null,
      timestamp: new Date()
    });

    // 6. Format content for script consumption
    const formattedContent = content.map(item => ({
      type: item.contentType,
      data: {
        optimized: item.optimizedContent,
        ...(item.metadata as Record<string, any> || {})
      }
    }));

    res.json({ 
      success: true,
      content: formattedContent,
      siteId: site[0].id
    });

  } catch (error) {
    console.error('Content retrieval error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Event tracking endpoint for JavaScript tracker
// POST /tracker/event
router.post('/event', async (req, res) => {
  try {
    const { siteId, eventType, eventData, sessionId, url, timestamp } = req.body;
    
    // 1. Validate required fields
    if (!siteId || !eventType || !url) {
      res.status(400).json({ error: 'siteId, eventType, and url are required' });
      return;
    }

    // 2. Authenticate site using tracker_id
    const site = await db.select().from(sites).where(eq(sites.trackerId, siteId));
    if (!site.length) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    const normalizedUrl = normalizeUrl(url);

    // 3. Store tracking event
    await db.insert(trackerData).values({
      siteId: site[0].id,
      pageUrl: normalizedUrl,
      eventType,
      eventData: eventData || {},
      sessionId: sessionId && isValidUUID(sessionId) ? sessionId : null,
      anonymousUserId: req.body.anonymousUserId && isValidUUID(req.body.anonymousUserId) ? req.body.anonymousUserId : null,
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      referrer: req.headers.referer || '',
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    // 4. Update page analytics for page view events
    if (eventType === 'page_view') {
      await updatePageAnalytics(site[0].id, normalizedUrl, eventData || {});
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Update page analytics (helper function)
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
router.get('/script/:trackerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackerId } = req.params;
    
    // Find site by tracker ID
    const site = await db.select().from(sites).where(eq(sites.trackerId, trackerId));
    if (!site.length) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    // Generate the tracking script HTML
    const apiBase = process.env.NODE_ENV === 'production' 
      ? process.env.API_URL || 'https://api.llmoptimizer.com'
      : 'http://localhost:3001';

    const scriptHtml = `<!-- Clever Search Tracking Script -->
<script>
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_BASE: '${apiBase}',
    SITE_ID: '${site[0].trackerId}',
    VERSION: '1.0.0',
    RETRY_ATTEMPTS: 3,
    TIMEOUT: 5000
  };

        console.log('Clever Search: Loading tracker with config:', CONFIG);

  // Load the main tracker script
  const script = document.createElement('script');
  script.src = CONFIG.API_BASE + '/tracker/v1/tracker.js?v=' + CONFIG.VERSION;
  script.async = true;
  script.defer = true;
  
  // Set configuration for the main script
  script.setAttribute('data-config', JSON.stringify(CONFIG));
  
  script.onload = function() {
            console.log('Clever Search: Tracker script loaded successfully');
  };
  
  script.onerror = function() {
            console.warn('Clever Search script failed to load');
  };
  
  // Insert script
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
})();
</script>`;

    res.json({
      siteId: site[0].id,
      siteName: site[0].name,
      trackerId: site[0].trackerId,
      scriptHtml: scriptHtml,
      instructions: {
        installation: "Copy the script above and paste it in your website's <head> section, preferably near the top.",
        verification: "After installation, visit your website and check the browser console for 'Clever Search' messages to verify the script is working.",
        support: "If you need help, contact our support team."
      }
    });

  } catch (error) {
    console.error('Tracker script generation error:', error);
    next(error);
  }
});

export default router;
