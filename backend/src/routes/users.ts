import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { users, sites, pages, analysisResults, pageContent, trackerData } from '../db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';
import { z } from 'zod';

// Extend Express Request type to include user
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  preferences: z.object({
    dashboardView: z.enum(['grid', 'list']).optional(),
    emailNotifications: z.boolean().optional(),
    autoAnalysis: z.boolean().optional(),
  }).optional(),
});

/**
 * @openapi
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile with statistics
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 preferences:
 *                   type: object
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     sitesCount:
 *                       type: number
 *                     pagesCount:
 *                       type: number
 *                     deploymentsCount:
 *                       type: number
 *                     analysisCount:
 *                       type: number
 *                     recentActivity:
 *                       type: array
 *       404:
 *         description: User not found
 */
// Get user profile with statistics
router.get('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get user details from our database
    const userArr = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);
    let user = userArr[0];
    
    // If user doesn't exist in our database, create them
    if (!user) {
      const [newUser] = await db.insert(users).values({
        id: req.user!.userId,
        email: req.user!.email,
      }).returning();
      user = newUser;
    }

    // Get statistics
    const [sitesCountResult] = await db
      .select({ count: count() })
      .from(sites)
      .where(eq(sites.userId, req.user!.userId));

    const [pagesCountResult] = await db
      .select({ count: count() })
      .from(pages)
      .innerJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(sites.userId, req.user!.userId));

    const [deploymentsCountResult] = await db
      .select({ count: count() })
      .from(pageContent)
      .innerJoin(pages, eq(pageContent.pageId, pages.id))
      .innerJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(sites.userId, req.user!.userId));

    const [analysisCountResult] = await db
      .select({ count: count() })
      .from(analysisResults)
      .innerJoin(pages, eq(analysisResults.pageId, pages.id))
      .innerJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(sites.userId, req.user!.userId));

    // Get recent activity (last 10 activities)
    const recentActivity = await db
      .select({
        id: trackerData.id,
        eventType: trackerData.eventType,
        pageUrl: trackerData.pageUrl,
        timestamp: trackerData.timestamp,
        siteName: sites.name,
      })
      .from(trackerData)
      .innerJoin(sites, eq(trackerData.siteId, sites.id))
      .where(eq(sites.userId, req.user!.userId))
      .orderBy(desc(trackerData.timestamp))
      .limit(10);

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      preferences: user.preferences || {
        dashboardView: 'grid',
        emailNotifications: true,
        autoAnalysis: false,
      },
      statistics: {
        sitesCount: sitesCountResult.count,
        pagesCount: pagesCountResult.count,
        deploymentsCount: deploymentsCountResult.count,
        analysisCount: analysisCountResult.count,
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.eventType,
          pageUrl: activity.pageUrl,
          siteName: activity.siteName,
          timestamp: activity.timestamp,
        })),
      },
    };

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               preferences:
 *                 type: object
 *                 properties:

 *                   dashboardView:
 *                     type: string
 *                     enum: [grid, list]
 *                   emailNotifications:
 *                     type: boolean
 *                   autoAnalysis:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 preferences:
 *                   type: object
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 */
// Update user profile
router.put('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Invalid input', errors: parse.error.errors });
      return;
    }

    const { name, preferences } = parse.data;

    // Get current user
    const userArr = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);
    let user = userArr[0];

    if (!user) {
      // Create user if they don't exist
      const [newUser] = await db.insert(users).values({
        id: req.user!.userId,
        email: req.user!.email,
        name: name || '',
        preferences: preferences || {},
      }).returning();
      user = newUser;
    } else {
      // Update existing user
      const updateData: any = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (preferences !== undefined) {
        updateData.preferences = { ...(user.preferences || {}), ...preferences };
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.userId))
        .returning();
      user = updatedUser;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      preferences: user.preferences,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router; 