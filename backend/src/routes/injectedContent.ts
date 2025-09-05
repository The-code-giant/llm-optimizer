import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { pageContent, sites, pages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';
import { z } from 'zod';
import cache from '../utils/cache';

// Extend Express Request type to include user
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

// Schema for creating injected content
const createContentSchema = z.object({
  contentType: z.string(),
  content: z.string(),
  pageUrl: z.string().optional(),
  isActive: z.boolean().default(true)
});

/**
 * @openapi
 * /api/v1/injected-content/{siteId}:
 *   get:
 *     summary: Get injected content for a site
 *     tags: [Injected Content]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of injected content
 */
router.get('/:siteId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Verify site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, req.params.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }

    // Get all pages for this site
    const sitePages = await db.select().from(pages).where(eq(pages.siteId, req.params.siteId));
    const pageIds = sitePages.map(page => page.id);

    // Get active content for all pages in this site
    const contentList = await db.select()
      .from(pageContent)
      .where(and(
        eq(pageContent.isActive, 1),
        // Filter by pages belonging to this site
        ...pageIds.length > 0 ? [pageContent.pageId] : []
      ));

    res.json(contentList);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/injected-content:
 *   post:
 *     summary: Create injected content
 *     tags: [Injected Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteId
 *               - contentType
 *               - content
 *             properties:
 *               siteId:
 *                 type: string
 *               contentType:
 *                 type: string
 *               content:
 *                 type: string
 *               pageUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Content created successfully
 */
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { siteId, ...contentData } = req.body;
    const parsed = createContentSchema.safeParse(contentData);
    
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid input', errors: parsed.error.errors });
      return;
    }

    // Verify site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }

    // For now, return a placeholder response
    // This functionality should be implemented using the pageContent system
    res.status(501).json({ 
      message: 'Injected content functionality is being migrated to the new page content system',
      suggestion: 'Please use the page-specific content deployment endpoints instead'
    });
    
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/injected-content/{contentId}:
 *   put:
 *     summary: Update injected content
 *     tags: [Injected Content]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content updated successfully
 */
router.put('/:contentId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ 
      message: 'Injected content functionality is being migrated to the new page content system',
      suggestion: 'Please use the page-specific content deployment endpoints instead'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/injected-content/{contentId}:
 *   delete:
 *     summary: Delete injected content
 *     tags: [Injected Content]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content deleted successfully
 */
router.delete('/:contentId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ 
      message: 'Injected content functionality is being migrated to the new page content system',
      suggestion: 'Please use the page-specific content deployment endpoints instead'
    });
  } catch (err) {
    next(err);
  }
});

export default router;