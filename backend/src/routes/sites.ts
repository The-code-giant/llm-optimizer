import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/client";
import { sites, users, pages, pageAnalytics, pageContent, trackerData, analysisResults, contentSuggestions } from "../db/schema";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { sitemapImportQueue } from "../utils/queue";
import { randomUUID } from "crypto";
import cache from "../utils/cache";
import { AnalysisService } from "../utils/analysisService";

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

import { authenticateJWT } from "../middleware/auth";
import { userService } from "../services/user.service";

const router = Router();

const siteSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
});

const sitemapImportSchema = z.object({
  sitemapUrl: z.string().url(),
});


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
router.post(
  "/",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parse = siteSchema.safeParse(req.body);
      if (!parse.success) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: parse.error.errors });
        return;
      }
      const { name, url } = parse.data;

      // Ensure user exists in our database
      await userService.ensureUserExists(req.user!.userId, req.user!.email);

      // Before creating the site, attempt to analyze the homepage to ensure it's reachable
      let analysisResult: any;
      try {
        console.log(`🔎 Validating and analyzing site before creation: ${url}`);
        analysisResult = await AnalysisService.analyzePage({
          url,
          forceRefresh: true,
        });
      } catch (analysisError) {
        console.error(`❌ Analysis failed during site creation for ${url}:`, analysisError);
        res.status(400).json({
          message:
            "We couldn't reach or analyze the website. Please verify the URL is correct and publicly accessible, then try again.",
        });
        return;
      }

      // Generate trackerId and set status
      const trackerId = randomUUID();
      const status = "active";

      const [site] = await db
        .insert(sites)
        .values({
          userId: req.user!.userId,
          name,
          url,
          trackerId,
          status,
        })
        .returning();

      // Invalidate user sites cache
      await cache.invalidateUserSites(req.user!.userId);

      // Create a default page for the site URL with analysis data
      const [defaultPage] = await db
        .insert(pages)
        .values({
          siteId: site.id,
          url: url,
          title: analysisResult?.content?.title || name,
          llmReadinessScore: analysisResult?.score || 0,
          contentSnapshot: analysisResult?.content
            ? JSON.stringify(analysisResult.content)
            : undefined,
          lastAnalysisAt: new Date(),
          lastScannedAt: new Date(),
        })
        .returning();

      // Store analysis results in database
      try {
        await db.insert(analysisResults).values({
          pageId: defaultPage.id,
          analyzedAt: new Date(),
          llmModelUsed: 'gpt-4o-mini',
          score: analysisResult.score,
          recommendations: JSON.stringify({
            issues: analysisResult.issues,
            recommendations: analysisResult.recommendations,
            summary: analysisResult.summary,
            pageSummary: analysisResult.pageSummary,
            contentQuality: analysisResult.contentQuality,
            technicalSEO: analysisResult.technicalSEO,
            keywordAnalysis: analysisResult.keywordAnalysis,
            llmOptimization: analysisResult.llmOptimization,
          }),
          rawLlmOutput: JSON.stringify(analysisResult),
        });
      } catch (contentError) {
        console.error(`❌ Failed to persist analysis results for new site ${url}:`, contentError);
      }

      console.log(`✅ Site created and analysis succeeded for ${url} - Score: ${analysisResult.score}/100`);

      res.status(201).json(site);
    } catch (err) {
      next(err);
    }
  }
);

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
// List sites for the authenticated user - Enhanced with Redis caching
router.get(
  "/",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // Try cache first
      const cachedSites = await cache.getUserSites(userId);
      if (cachedSites) {
        res.json(cachedSites);
        return;
      }

      // Ensure user exists in our database
      await userService.ensureUserExists(userId, req.user!.email);

      const userSites = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.userId, userId),
            sql`${sites.deletedAt} IS NULL`
          )
        );

      // Cache the result for 5 minutes
      await cache.setUserSites(userId, userSites);

      res.json(userSites);
    } catch (err) {
      next(err);
    }
  }
);

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
router.get(
  "/:siteId",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const siteArr = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, req.params.siteId),
            sql`${sites.deletedAt} IS NULL`
          )
        )
        .limit(1);
      const site = siteArr[0];
      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ message: "Site not found" });
        return;
      }
      res.json(site);
    } catch (err) {
      next(err);
    }
  }
);

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
router.put(
  "/:siteId",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parse = siteSchema.partial().safeParse(req.body);
      if (!parse.success) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: parse.error.errors });
        return;
      }
      const siteArr = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, req.params.siteId),
            sql`${sites.deletedAt} IS NULL`
          )
        )
        .limit(1);
      const site = siteArr[0];
      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ message: "Site not found" });
        return;
      }
      const [updated] = await db
        .update(sites)
        .set({ ...parse.data, updatedAt: new Date() })
        .where(eq(sites.id, req.params.siteId))
        .returning();

      // Invalidate user sites cache
      await cache.invalidateUserSites(req.user!.userId);

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

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
// Delete site (soft delete)
router.delete(
  "/:siteId",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];
      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ message: "Site not found" });
        return;
      }
      
      // Soft delete - mark as deleted instead of removing
      await db
        .update(sites)
        .set({ 
          deletedAt: new Date(),
          status: "deleted"
        })
        .where(eq(sites.id, req.params.siteId));

      // Invalidate user sites cache
      await cache.invalidateUserSites(req.user!.userId);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/import-sitemap:
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sitemapUrl]
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
// Import sitemap for a site (updated path to match frontend expectation)
router.post(
  "/:siteId/import-sitemap",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parse = sitemapImportSchema.safeParse(req.body);
      if (!parse.success) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: parse.error.errors });
        return;
      }
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];
      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ message: "Site not found" });
        return;
      }
      // Enqueue sitemap import job
      const job = await sitemapImportQueue.add("import", {
        siteId: req.params.siteId,
        sitemapUrl: parse.data.sitemapUrl,
        userId: req.user!.userId,
      });
      res
        .status(202)
        .json({ message: "Sitemap import started", jobId: job.id });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/pages:
 *   get:
 *     summary: List pages for a site
 *     tags: [Sites, Pages]
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
router.get(
  "/:siteId/pages",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];
      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ message: "Site not found" });
        return;
      }
      const sitePages = await db
        .select()
        .from(pages)
        .where(eq(pages.siteId, req.params.siteId));
      res.json(sitePages);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/pages:
 *   post:
 *     summary: Add a single page to a site
 *     tags: [Sites, Pages]
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
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/new-page
 *               title:
 *                 type: string
 *                 example: New Page Title
 *     responses:
 *       201:
 *         description: Page added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       400:
 *         description: Invalid input or page already exists
 *       404:
 *         description: Site not found
 */
// Add a single page to a site
router.post(
  "/:siteId/pages",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { url, title } = req.body;

      // Validate input
      if (!url) {
        res.status(400).json({ message: "URL is required" });
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        res.status(400).json({ message: "Invalid URL format" });
        return;
      }

      // Check if site exists and user owns it
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];
      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ message: "Site not found" });
        return;
      }

      // Check if page already exists for this site
      const existingPage = await db
        .select()
        .from(pages)
        .where(and(eq(pages.siteId, req.params.siteId), eq(pages.url, url)));

      if (existingPage.length > 0) {
        res.status(400).json({ message: "Page with this URL already exists" });
        return;
      }

      // Create new page
      const newPage = await db
        .insert(pages)
        .values({
          siteId: req.params.siteId,
          url: url,
          title: title || new URL(url).pathname,
          llmReadinessScore: 0, // Initial score
        })
        .returning();

      res.status(201).json(newPage[0]);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/tracker-script:
 *   get:
 *     summary: Get tracking script for a site
 *     tags: [Sites, Tracker]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking script HTML and Next.js format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 siteId:
 *                   type: string
 *                 siteName:
 *                   type: string
 *                 trackerId:
 *                   type: string
 *                 nextJsScript:
 *                   type: string
 *                 scriptHtml:
 *                   type: string
 *                 config:
 *                   type: object
 *                 instructions:
 *                   type: object
 *       404:
 *         description: Site not found
 */
// Get tracking script for a site
router.get(
  "/:siteId/tracker-script",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];
      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ message: "Site not found" });
        return;
      }

      const platform = req.query.platform as string || 'nextjs';

      // Generate the API base URL
      const apiBase =
        process.env.NODE_ENV === "production"
          ? process.env.API_URL || "https://backend.cleversearch.ai"
          : "http://localhost:3001";

      // Generate Next.js Script component with simplified configuration
      const nextScriptFormat = `<Script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config={JSON.stringify({
    SITE_ID: "${site.trackerId}"
  })}
  async
  strategy="beforeInteractive"
/>`;

      // For all non-Next.js platforms, use a plain <script> tag with simplified data-config
      const universalScript = `<script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config='{"SITE_ID":"${site.trackerId}"}'
  async
  defer
></script>`;

      // Platform-specific installation instructions
      const installInstructions: Record<string, string> = {
        nextjs: `Add the <code>nextJsScript</code> to your Next.js app, preferably in <code>_app.tsx</code> or your main layout. Import <code>Script</code> from <code>next/script</code>.`,
        wordpress: `Paste the <code>universalScript</code> into your theme's <code>header.php</code> file before <code>&lt;/head&gt;</code>.`,
        shopify: `Paste the <code>universalScript</code> into your <code>theme.liquid</code> file before <code>&lt;/head&gt;</code>.`,
        wix: `Add the <code>universalScript</code> in Wix's Custom Code section and choose the Head location.`,
        squarespace: `Paste the <code>universalScript</code> in the Code Injection section under Settings → Advanced → Header.`,
        other: `Paste the <code>universalScript</code> into your website's <code>&lt;head&gt;</code> section.`
      };

      res.json({
        siteId: site.id,
        siteName: site.name,
        trackerId: site.trackerId,
        nextJsScript: nextScriptFormat,
        universalScript: universalScript,
        scriptHtml: universalScript, // for backward compatibility
        config: {
          SITE_ID: site.trackerId
        },
        instructions: {
          installation: installInstructions[platform] || installInstructions.other,
          verification: "After installation, visit your website and check the browser console for 'Cleversearch' messages to verify the script is working.",
          support: "If you need help, contact our support team.",
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get analytics data for a site
router.get(
  "/:siteId/analytics",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const timeRange = (req.query.timeRange as string) || "7d";
      const siteArr = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, req.params.siteId),
            sql`${sites.deletedAt} IS NULL`
          )
        )
        .limit(1);
      const site = siteArr[0];

      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ error: "Site not found" });
        return;
      }

      // Calculate date range based on timeRange
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get analytics data from pageAnalytics table
      const analyticsData = await db
        .select()
        .from(pageAnalytics)
        .where(
          and(
            eq(pageAnalytics.siteId, site.id),
            // Filter by date range
            // Note: visitDate is stored as YYYY-MM-DD string
            // We'll filter in JavaScript for better date handling
          )
        );

      // Filter by date range in JavaScript
      const filteredAnalytics = analyticsData.filter(record => {
        const recordDate = new Date(record.visitDate);
        return recordDate >= startDate && recordDate <= now;
      });

      // Calculate overview metrics
      const totalViews = filteredAnalytics.reduce((sum, record) => sum + (record.pageViews || 0), 0);
      const uniqueVisitors = filteredAnalytics.reduce((sum, record) => sum + (record.uniqueVisitors || 0), 0);
      const avgLoadTime = filteredAnalytics.length > 0 
        ? Math.round(filteredAnalytics.reduce((sum, record) => sum + (record.loadTimeMs || 0), 0) / filteredAnalytics.length)
        : 0;

      // Get content deployments count
      let contentDeployments: { count: number }[] = [{ count: 0 }];
      try {
        const result = await db
          .select({ count: sql`count(*)` })
          .from(pageContent)
          .where(
            and(
              sql`${pageContent.pageUrl} LIKE ${site.url + '%'}`,
              eq(pageContent.isActive, 1),
              sql`${pageContent.deployedAt} >= ${startDate.toISOString()}`
            )
          );
        contentDeployments = result.map(row => ({ count: Number(row.count) }));
      } catch (error) {
        console.error("Error fetching content deployments:", error);
      }

      // Get top performing pages
      let topPages: any[] = [];
      try {
        topPages = await db
          .select({
            pageUrl: pageAnalytics.pageUrl,
            pageViews: sql`SUM(${pageAnalytics.pageViews})`,
            avgLoadTime: sql`AVG(${pageAnalytics.loadTimeMs})`,
            bounceRate: sql`AVG(${pageAnalytics.bounceRate})`,
            contentInjected: sql`MAX(${pageAnalytics.contentInjected})`,
          })
          .from(pageAnalytics)
          .where(
            and(
              eq(pageAnalytics.siteId, site.id),
              sql`${pageAnalytics.visitDate} >= ${startDate.toISOString().split('T')[0]}`
            )
          )
          .groupBy(pageAnalytics.pageUrl)
          .orderBy(sql`SUM(${pageAnalytics.pageViews}) DESC`)
          .limit(10);
      } catch (error) {
        console.error("Error fetching top pages:", error);
      }

      // Get content performance data
      let contentPerformance: any[] = [];
      try {
        contentPerformance = await db
          .select({
            contentType: pageContent.contentType,
            deployedCount: sql`COUNT(*)`,
            pageUrl: pageContent.pageUrl,
          })
          .from(pageContent)
          .where(
            and(
              eq(pageContent.isActive, 1),
              sql`${pageContent.deployedAt} >= ${startDate.toISOString()}`,
              sql`${pageContent.pageUrl} LIKE ${site.url + '%'}`
            )
          )
          .groupBy(pageContent.contentType, pageContent.pageUrl);
      } catch (error) {
        console.error("Error fetching content performance:", error);
      }

      // Get recent activity from trackerData
      let recentActivity: any[] = [];
      try {
        recentActivity = await db
          .select({
            timestamp: trackerData.timestamp,
            eventType: trackerData.eventType,
            pageUrl: trackerData.pageUrl,
            eventData: trackerData.eventData,
          })
          .from(trackerData)
          .where(
            and(
              eq(trackerData.siteId, site.id),
              sql`${trackerData.timestamp} >= ${startDate.toISOString()}`
            )
          )
          .orderBy(sql`${trackerData.timestamp} DESC`)
          .limit(20);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      }

      // Calculate trends (compare with previous period)
      const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
      const previousAnalytics = await db
        .select()
        .from(pageAnalytics)
        .where(
          and(
            eq(pageAnalytics.siteId, site.id),
            sql`${pageAnalytics.visitDate} >= ${previousStartDate.toISOString().split('T')[0]}`,
            sql`${pageAnalytics.visitDate} < ${startDate.toISOString().split('T')[0]}`
          )
        );

      const previousViews = previousAnalytics.reduce((sum, record) => sum + (record.pageViews || 0), 0);
      const previousVisitors = previousAnalytics.reduce((sum, record) => sum + (record.uniqueVisitors || 0), 0);
      const previousLoadTime = previousAnalytics.length > 0 
        ? Math.round(previousAnalytics.reduce((sum, record) => sum + (record.loadTimeMs || 0), 0) / previousAnalytics.length)
        : 0;

      const viewsTrend = previousViews > 0 ? ((totalViews - previousViews) / previousViews) * 100 : 0;
      const visitorsTrend = previousVisitors > 0 ? ((uniqueVisitors - previousVisitors) / previousVisitors) * 100 : 0;
      const loadTimeTrend = previousLoadTime > 0 ? ((avgLoadTime - previousLoadTime) / previousLoadTime) * 100 : 0;

      // Format response
      const response = {
        overview: {
          totalViews,
          uniqueVisitors,
          avgLoadTime,
          contentDeployments: contentDeployments[0]?.count || 0,
          trendsPercentage: {
            views: Math.round(viewsTrend * 10) / 10,
            visitors: Math.round(visitorsTrend * 10) / 10,
            loadTime: Math.round(loadTimeTrend * 10) / 10,
            deployments: 0, // We'll calculate this separately if needed
          },
        },
        topPages: topPages.map(page => ({
          url: page.pageUrl,
          views: Number(page.pageViews) || 0,
          avgLoadTime: Math.round(Number(page.avgLoadTime) || 0),
          bounceRate: Math.round(Number(page.bounceRate) || 0),
          hasDeployedContent: Boolean(page.contentInjected),
        })),
        contentPerformance: contentPerformance.map(content => ({
          contentType: content.contentType,
          deployedCount: Number(content.deployedCount) || 0,
          avgImprovementPercent: 15, // This would need more complex calculation
          topPerformingUrl: content.pageUrl,
          views: 0, // Would need to join with analytics data
        })),
        recentActivity: recentActivity.map(activity => ({
          timestamp: activity.timestamp?.toISOString() || new Date().toISOString(),
          type: activity.eventType as 'page_view' | 'content_injection' | 'deployment',
          url: activity.pageUrl || '',
          metadata: activity.eventData,
        })),
        timeSeriesData: filteredAnalytics.map(record => ({
          date: record.visitDate,
          views: record.pageViews || 0,
          uniqueVisitors: record.uniqueVisitors || 0,
          avgLoadTime: record.loadTimeMs || 0,
        })),
      };

      res.json(response);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }
);

// Get detailed user demographics and traffic sources
router.get(
  "/:siteId/analytics/demographics",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const timeRange = (req.query.timeRange as string) || "7d";
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];

      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ error: "Site not found" });
        return;
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get traffic sources from trackerData
      const trafficSources = await db
        .select({
          referrer: trackerData.referrer,
          count: sql`COUNT(*)`,
        })
        .from(trackerData)
        .where(
          and(
            eq(trackerData.siteId, site.id),
            sql`${trackerData.timestamp} >= ${startDate.toISOString()}`,
            sql`${trackerData.eventType} = 'page_view'`
          )
        )
        .groupBy(trackerData.referrer)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10);

      // Get user agents for device/browser analysis
      const userAgents = await db
        .select({
          userAgent: trackerData.userAgent,
          count: sql`COUNT(*)`,
        })
        .from(trackerData)
        .where(
          and(
            eq(trackerData.siteId, site.id),
            sql`${trackerData.timestamp} >= ${startDate.toISOString()}`,
            sql`${trackerData.eventType} = 'page_view'`
          )
        )
        .groupBy(trackerData.userAgent)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10);

      // Get geographic data (if IP addresses are stored)
      const geographicData = await db
        .select({
          ipAddress: trackerData.ipAddress,
          count: sql`COUNT(*)`,
        })
        .from(trackerData)
        .where(
          and(
            eq(trackerData.siteId, site.id),
            sql`${trackerData.timestamp} >= ${startDate.toISOString()}`,
            sql`${trackerData.eventType} = 'page_view'`
          )
        )
        .groupBy(trackerData.ipAddress)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10);

      // Process and categorize the data
      const processedTrafficSources = trafficSources.map(source => ({
        source: source.referrer || 'Direct',
        count: Number(source.count),
        percentage: 0, // Will calculate below
      }));

      const totalTraffic = processedTrafficSources.reduce((sum, source) => sum + source.count, 0);
      processedTrafficSources.forEach(source => {
        source.percentage = totalTraffic > 0 ? Math.round((source.count / totalTraffic) * 100) : 0;
      });

      // Categorize user agents
      const deviceCategories = userAgents.map(agent => {
        const userAgent = agent.userAgent || '';
        let category = 'Unknown';
        
        if (userAgent.includes('Mobile')) category = 'Mobile';
        else if (userAgent.includes('Tablet')) category = 'Tablet';
        else if (userAgent.includes('Desktop')) category = 'Desktop';
        else if (!userAgent.includes('Mobile') && !userAgent.includes('Tablet')) category = 'Desktop';
        
        return {
          category,
          count: Number(agent.count),
        };
      });

      // Aggregate device categories
      const deviceBreakdown = deviceCategories.reduce((acc, device) => {
        acc[device.category] = (acc[device.category] || 0) + device.count;
        return acc;
      }, {} as Record<string, number>);

      const response = {
        trafficSources: processedTrafficSources,
        deviceBreakdown,
        geographicData: geographicData.map(geo => ({
          ip: geo.ipAddress,
          count: Number(geo.count),
        })),
        timeRange,
        totalSessions: totalTraffic,
      };

      res.json(response);
    } catch (error) {
      console.error("Demographics fetch error:", error);
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }
);

// Get page performance metrics
router.get(
  "/:siteId/analytics/page-performance",
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const timeRange = (req.query.timeRange as string) || "7d";
      const siteArr = await db
        .select()
        .from(sites)
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];

      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ error: "Site not found" });
        return;
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get page performance data
      const pagePerformance = await db
        .select({
          pageUrl: pageAnalytics.pageUrl,
          totalViews: sql`SUM(${pageAnalytics.pageViews})`,
          uniqueVisitors: sql`SUM(${pageAnalytics.uniqueVisitors})`,
          avgLoadTime: sql`AVG(${pageAnalytics.loadTimeMs})`,
          bounceRate: sql`AVG(${pageAnalytics.bounceRate})`,
          avgSessionDuration: sql`AVG(${pageAnalytics.avgSessionDuration})`,
          contentInjected: sql`MAX(${pageAnalytics.contentInjected})`,
        })
        .from(pageAnalytics)
        .where(
          and(
            eq(pageAnalytics.siteId, site.id),
            sql`${pageAnalytics.visitDate} >= ${startDate.toISOString().split('T')[0]}`
          )
        )
        .groupBy(pageAnalytics.pageUrl)
        .orderBy(sql`SUM(${pageAnalytics.pageViews}) DESC`);

      // Get content optimization impact
      const contentImpact = await db
        .select({
          pageUrl: pageContent.pageUrl,
          contentType: pageContent.contentType,
          deployedAt: pageContent.deployedAt,
          metadata: pageContent.metadata,
        })
        .from(pageContent)
        .where(
          and(
            eq(pageContent.isActive, 1),
            sql`${pageContent.deployedAt} >= ${startDate.toISOString()}`,
            sql`${pageContent.pageUrl} LIKE ${site.url + '%'}`
          )
        )
        .orderBy(sql`${pageContent.deployedAt} DESC`);

      // Calculate performance scores
      const performanceData = pagePerformance.map(page => {
        const loadTimeScore = page.avgLoadTime ? Math.max(0, 100 - (Number(page.avgLoadTime) / 100)) : 0;
        const bounceRateScore = page.bounceRate ? Math.max(0, 100 - Number(page.bounceRate)) : 0;
        const engagementScore = page.avgSessionDuration ? Math.min(100, (Number(page.avgSessionDuration) / 60) * 10) : 0;
        
        const overallScore = Math.round((loadTimeScore + bounceRateScore + engagementScore) / 3);
        
        return {
          url: page.pageUrl,
          views: Number(page.totalViews) || 0,
          uniqueVisitors: Number(page.uniqueVisitors) || 0,
          avgLoadTime: Math.round(Number(page.avgLoadTime) || 0),
          bounceRate: Math.round(Number(page.bounceRate) || 0),
          avgSessionDuration: Math.round(Number(page.avgSessionDuration) || 0),
          hasOptimizedContent: Boolean(page.contentInjected),
          performanceScore: overallScore,
          loadTimeScore: Math.round(loadTimeScore),
          bounceRateScore: Math.round(bounceRateScore),
          engagementScore: Math.round(engagementScore),
        };
      });

      const response = {
        pagePerformance: performanceData,
        contentOptimizations: contentImpact.map(content => ({
          url: content.pageUrl,
          contentType: content.contentType,
          deployedAt: content.deployedAt?.toISOString(),
          metadata: content.metadata,
        })),
        summary: {
          totalPages: performanceData.length,
          avgPerformanceScore: performanceData.length > 0 
            ? Math.round(performanceData.reduce((sum, page) => sum + page.performanceScore, 0) / performanceData.length)
            : 0,
          optimizedPages: performanceData.filter(page => page.hasOptimizedContent).length,
          highPerformingPages: performanceData.filter(page => page.performanceScore >= 80).length,
        },
        timeRange,
      };

      res.json(response);
    } catch (error) {
      console.error("Page performance fetch error:", error);
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }
);

// Note: Site-wide deployment routes have been deprecated in favor of page-specific deployment.
// Use the page-specific routes in /pages/{pageId}/content/{contentType}/deploy instead.

// Pre-submit website URL (before user signup)
const preSubmitSchema = z.object({
  url: z
    .string()
    .min(1, "Website URL is required")
    .transform((url) => {
      // Normalize URL by adding https:// if no protocol
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
      }
      return url;
    })
    .pipe(z.string().url("Please enter a valid website URL"))
    .refine((url) => {
      const urlObj = new URL(url);

      // Only allow HTTP/HTTPS protocols
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return false;
      }

      // Must have a valid hostname with at least one dot
      const hostname = urlObj.hostname;
      return hostname && hostname.includes(".") && hostname.length >= 3;
    }, "Please enter a valid website domain (e.g., example.com)")
    .refine((url) => {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check for valid domain characters (letters, numbers, hyphens, dots)
      const validDomainRegex =
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return validDomainRegex.test(hostname);
    }, "Please enter a valid website domain format"),
});

router.post(
  "/pre-submit",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parse = preSubmitSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({
          success: false,
          message: "Invalid URL format. Please enter a valid website URL.",
          errors: parse.error.errors,
        });
        return;
      }

      const { url } = parse.data;

      // Basic URL validation and normalization
      let normalizedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        normalizedUrl = `https://${url}`;
      }

      // Store the URL in session or temporary storage for later use
      // For now, we'll just validate and return success
      // In a real implementation, you might want to:
      // 1. Store in Redis with expiration
      // 2. Pre-analyze the URL
      // 3. Generate a temporary site ID

      res.json({
        success: true,
        message:
          "Website URL submitted successfully. Please sign up to continue.",
        redirectUrl: `/register?website=${encodeURIComponent(normalizedUrl)}`,
      });
    } catch (error) {
      console.error("Pre-submit error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again.",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }
);

export default router;
