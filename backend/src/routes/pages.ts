import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { pages, sites } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';

// Extend Express Request type to include user
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

/**
 * @openapi
 * /api/v1/sites/{siteId}/pages:
 *   get:
 *     summary: List pages for a site
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of pages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Page'
 *       404:
 *         description: Site not found
 */
// List pages for a site
router.get('/sites/:siteId/pages', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const siteArr = await db.select().from(sites).where(eq(sites.id, req.params.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    const sitePages = await db.select().from(pages).where(eq(pages.siteId, req.params.siteId));
    res.json(sitePages);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}:
 *   get:
 *     summary: Get page details
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       404:
 *         description: Page not found or not authorized
 */
// Get page details
router.get('/pages/:pageId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    res.json(page);
  } catch (err) {
    next(err);
  }
});

export default router;
