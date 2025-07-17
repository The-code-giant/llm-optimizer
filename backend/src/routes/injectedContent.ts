import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { injectedContent, sites, pageInjectedContent, pages } from '../db/schema';
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

const injectedContentSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  content: z.string().min(1),
  status: z.string().min(2),
});

/**
 * @openapi
 * /api/v1/sites/{siteId}/injected-content:
 *   get:
 *     summary: List injected content for a site
 *     tags: [InjectedContent]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of injected content
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InjectedContent'
 *       404:
 *         description: Site not found
 */
// List injected content for a site
router.get('/sites/:siteId/injected-content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const siteArr = await db.select().from(sites).where(eq(sites.id, req.params.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    const contentList = await db.select().from(injectedContent).where(eq(injectedContent.siteId, req.params.siteId));
    res.json(contentList);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/sites/{siteId}/injected-content:
 *   post:
 *     summary: Create new injected content
 *     tags: [InjectedContent]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InjectedContentInput'
 *     responses:
 *       201:
 *         description: Injected content created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InjectedContent'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Site not found
 */
// Create new injected content
router.post('/sites/:siteId/injected-content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parse = injectedContentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Invalid input', errors: parse.error.errors });
      return;
    }
    const siteArr = await db.select().from(sites).where(eq(sites.id, req.params.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    const [content] = await db.insert(injectedContent).values({
      ...parse.data,
      siteId: req.params.siteId,
    }).returning();

    // 🔥 CACHE INVALIDATION: If content is active, invalidate cache for all pages
    if (content.status === 'active') {
      console.log(`🗑️  Invalidating cache for new injected content: ${site.trackerId} (${content.type})`);
      // Note: We invalidate all pages for this tracker since injected content can affect multiple pages
      await cache.invalidateTrackerContent(site.trackerId);
    }

    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/injected-content/{contentId}:
 *   get:
 *     summary: Get injected content details
 *     tags: [InjectedContent]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Injected content details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InjectedContent'
 *       404:
 *         description: Content not found or not authorized
 */
// Get injected content details
router.get('/injected-content/:contentId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const contentArr = await db.select().from(injectedContent).where(eq(injectedContent.id, req.params.contentId)).limit(1);
    const content = contentArr[0];
    if (!content) {
      res.status(404).json({ message: 'Content not found' });
      return;
    }
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, content.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }
    res.json(content);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/injected-content/{contentId}:
 *   put:
 *     summary: Update injected content
 *     tags: [InjectedContent]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InjectedContentInput'
 *     responses:
 *       200:
 *         description: Injected content updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InjectedContent'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Content not found or not authorized
 */
// Update injected content
router.put('/injected-content/:contentId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parse = injectedContentSchema.partial().safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Invalid input', errors: parse.error.errors });
      return;
    }
    const contentArr = await db.select().from(injectedContent).where(eq(injectedContent.id, req.params.contentId)).limit(1);
    const content = contentArr[0];
    if (!content) {
      res.status(404).json({ message: 'Content not found' });
      return;
    }
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, content.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }
    const [updated] = await db.update(injectedContent)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(injectedContent.id, req.params.contentId))
      .returning();

    // 🔥 CACHE INVALIDATION: If content status changed to/from active, or content was modified while active
    const statusChanged = parse.data.status && parse.data.status !== content.status;
    const contentModified = parse.data.content && parse.data.content !== content.content;
    const isActiveContent = updated.status === 'active' || content.status === 'active';
    
    if (isActiveContent && (statusChanged || contentModified)) {
      console.log(`🗑️  Invalidating cache for updated injected content: ${site.trackerId} (${updated.type})`);
      await cache.invalidateTrackerContent(site.trackerId);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/injected-content/{contentId}:
 *   delete:
 *     summary: Delete injected content
 *     tags: [InjectedContent]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Injected content deleted
 *       404:
 *         description: Content not found or not authorized
 */
// Delete injected content
router.delete('/injected-content/:contentId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const contentArr = await db.select().from(injectedContent).where(eq(injectedContent.id, req.params.contentId)).limit(1);
    const content = contentArr[0];
    if (!content) {
      res.status(404).json({ message: 'Content not found' });
      return;
    }
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, content.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    // Delete page associations first
    await db.delete(pageInjectedContent).where(eq(pageInjectedContent.injectedContentId, req.params.contentId));
    
    // Delete the content
    await db.delete(injectedContent).where(eq(injectedContent.id, req.params.contentId));

    // 🔥 CACHE INVALIDATION: If deleted content was active, invalidate cache
    if (content.status === 'active') {
      console.log(`🗑️  Invalidating cache for deleted injected content: ${site.trackerId} (${content.type})`);
      await cache.invalidateTrackerContent(site.trackerId);
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
