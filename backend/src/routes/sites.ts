import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, users } from '../db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { sitemapImportQueue } from '../utils/queue';
import { randomUUID } from 'crypto';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

import { authenticateJWT } from '../middleware/auth';

const router = Router();

const siteSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
});

const sitemapImportSchema = z.object({
  sitemapUrl: z.string().url().optional(),
});

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string, email: string) {
  try {
    // Try to find the user first
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (existingUser.length === 0) {
      // Create the user if they don't exist
      await db.insert(users).values({
        id: userId,
        email: email,
      });
    }
  } catch (error) {
    // User might already exist due to concurrent requests, ignore duplicate key errors
    if (!(error as any)?.constraint) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }
}

/**
 * @openapi
 * components:
 *   schemas:
 *     Site:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         url:
 *           type: string
 *         trackerId:
 *           type: string
 *         status:
 *           type: string
 *         settings:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Page:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         siteId:
 *           type: string
 *         url:
 *           type: string
 *         title:
 *           type: string
 *         contentSnapshot:
 *           type: string
 *         lastScannedAt:
 *           type: string
 *           format: date-time
 *         lastAnalysisAt:
 *           type: string
 *           format: date-time
 *         llmReadinessScore:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     InjectedContent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         siteId:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         content:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     InjectedContentInput:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - content
 *         - status
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         content:
 *           type: string
 *         status:
 *           type: string
 */

/**
 * @openapi
 * /api/v1/sites:
 *   post:
 *     summary: Create a new site
 *     tags: [Sites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, url]
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Website
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com
 *     responses:
 *       201:
 *         description: Site created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Site'
 *       400:
 *         description: Invalid input
 */
// Create a new site
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parse = siteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Invalid input', errors: parse.error.errors });
      return;
    }
    const { name, url } = parse.data;
    
    // Ensure user exists in our database
    await ensureUserExists(req.user!.userId, req.user!.email);
    
    // Generate trackerId and set status
    const trackerId = randomUUID();
    const status = 'created';
    
    const [site] = await db.insert(sites).values({
      userId: req.user!.userId,
      name,
      url,
      trackerId,
      status,
    }).returning();
    
    res.status(201).json(site);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/sites:
 *   get:
 *     summary: List all sites for the authenticated user
 *     tags: [Sites]
 *     responses:
 *       200:
 *         description: List of sites
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Site'
 */
// List sites for the authenticated user
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Ensure user exists in our database
    await ensureUserExists(req.user!.userId, req.user!.email);
    
    const userSites = await db.select().from(sites).where(eq(sites.userId, req.user!.userId));
    res.json(userSites);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/sites/{siteId}:
 *   get:
 *     summary: Get site details
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Site'
 *       404:
 *         description: Site not found
 */
// Get site details
router.get('/:siteId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const siteArr = await db.select().from(sites).where(eq(sites.id, req.params.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    res.json(site);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/sites/{siteId}:
 *   put:
 *     summary: Update a site
 *     tags: [Sites]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://updated.com
 *     responses:
 *       200:
 *         description: Site updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Site'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Site not found
 */
// Update site
router.put('/:siteId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parse = siteSchema.partial().safeParse(req.body);
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
    const [updated] = await db.update(sites)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(sites.id, req.params.siteId))
      .returning();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/sites/{siteId}:
 *   delete:
 *     summary: Delete a site
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Site deleted
 *       404:
 *         description: Site not found
 */
// Delete site
router.delete('/:siteId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const siteArr = await db.select().from(sites).where(eq(sites.id, req.params.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    await db.delete(sites).where(eq(sites.id, req.params.siteId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/sites/{siteId}/sitemap/import:
 *   post:
 *     summary: Import a sitemap for a site
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sitemapUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/sitemap.xml
 *     responses:
 *       202:
 *         description: Sitemap import started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Site not found
 */
// Import sitemap for a site
router.post('/:siteId/sitemap/import', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parse = sitemapImportSchema.safeParse(req.body);
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
    // Enqueue sitemap import job
    const job = await sitemapImportQueue.add('import', {
      siteId: req.params.siteId,
      sitemapUrl: parse.data.sitemapUrl || site.url + '/sitemap.xml',
      userId: req.user!.userId,
    });
    res.status(202).json({ message: 'Sitemap import started', jobId: job.id });
  } catch (err) {
    next(err);
  }
});

export default router;
