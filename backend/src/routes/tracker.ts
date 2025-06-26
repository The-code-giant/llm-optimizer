import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, injectedContent, pages, pageInjectedContent } from '../db/schema';
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

export default router;
