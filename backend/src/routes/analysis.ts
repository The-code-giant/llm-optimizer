import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';
import { analysisQueue } from '../utils/queue';

// Extend Express Request type to include user
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

/**
 * @openapi
 * /api/v1/sites/{siteId}/analysis:
 *   post:
 *     summary: Trigger analysis for all pages in a site
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Analysis started for all pages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
 *                   type: string
 *       404:
 *         description: Site not found
 */
// Trigger analysis for all pages in a site
router.post('/sites/:siteId/analysis', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const siteArr = await db.select().from(sites).where(eq(sites.id, req.params.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    // Enqueue analysis job for all pages
    const job = await analysisQueue.add('site-analysis', {
      siteId: req.params.siteId,
      userId: req.user!.userId,
    });
    res.status(202).json({ message: 'Analysis started for all pages', jobId: job.id });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/analysis:
 *   post:
 *     summary: Trigger analysis for a specific page
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Analysis started for page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
 *                   type: string
 *       404:
 *         description: Page not found or not authorized
 */
// Trigger analysis for a specific page
router.post('/pages/:pageId/analysis', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }
    // Enqueue analysis job for this page
    const job = await analysisQueue.add('page-analysis', {
      pageId: req.params.pageId,
      userId: req.user!.userId,
    });
    res.status(202).json({ message: 'Analysis started for page', jobId: job.id });
  } catch (err) {
    next(err);
  }
});

export default router;
