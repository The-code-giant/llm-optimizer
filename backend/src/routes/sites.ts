import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/client";
import { sites, users, pages, userSubscriptions } from "../db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { sitemapImportQueue } from "../utils/queue";
import { randomUUID } from "crypto";
import cache from "../utils/cache";

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

import { authenticateJWT } from "../middleware/auth";
import { StripeClient } from "../lib/stripe";
import { clerkClient } from "../lib/clerk-client";

const router = Router();

const siteSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
});

const sitemapImportSchema = z.object({
  sitemapUrl: z.string().url(),
});

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string, email: string) {
  try {
    // Try to find the user first
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      // Create the user if they don't exist
      await db.insert(users).values({
        id: userId,
        email: email,
      });

      // create a customer in stripe
      const stripeCustomerId = await new StripeClient().createCustomer({
        email: email,
        userId: userId,
      });

      if (stripeCustomerId) {
        // create a free subscription for the user right after they sign up
        await db.insert(userSubscriptions).values({
          userId: userId,
          stripeCustomerId,
        });

        // update profile metadata with plan type
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: { planType: "free" },
        });
      }
    }
  } catch (error) {
    // User might already exist due to concurrent requests, ignore duplicate key errors
    if (!(error as any)?.constraint) {
      console.error("Error ensuring user exists:", error);
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
      await ensureUserExists(req.user!.userId, req.user!.email);

      // Generate trackerId and set status
      const trackerId = randomUUID();
      const status = "created";

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
      await ensureUserExists(userId, req.user!.email);

      const userSites = await db
        .select()
        .from(sites)
        .where(eq(sites.userId, userId));

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
        .where(eq(sites.id, req.params.siteId))
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
        .where(eq(sites.id, req.params.siteId))
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
// Delete site
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
      await db.delete(sites).where(eq(sites.id, req.params.siteId));

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

      // Generate the API base URL
      const apiBase =
        process.env.NODE_ENV === "production"
          ? process.env.API_URL || "https://backend.cleversearch.ai"
          : "http://localhost:3001";

      // Generate Next.js Script component with full configuration
      const nextScriptFormat = `<Script
  id="clever-search-tracker"
  src="${apiBase}/tracker/v1/tracker.js"
  data-config={JSON.stringify({
    "API_BASE": "${apiBase}",
    "SITE_ID": "${site.trackerId}",
    "VERSION": "1.0.0",
    "RETRY_ATTEMPTS": 3,
    "TIMEOUT": 2000,
    "UPDATE_INTERVAL": 500,
    "MAX_INTERVAL_DURATION": 120000,
    "FAST_MODE": true
  })}
  async
  strategy="beforeInteractive"
/>`;

      // Also provide legacy inline script for non-Next.js users
      const legacyScriptHtml = `<!-- Clever Search Tracking Script -->
<script>
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_BASE: '${apiBase}',
    SITE_ID: '${site.trackerId}',
    VERSION: "1.0.0",
    RETRY_ATTEMPTS: 3,
    TIMEOUT: 2000,
    UPDATE_INTERVAL: 500,
    MAX_INTERVAL_DURATION: 120000,
    FAST_MODE: true
  };

  // Load the main tracker script
  const script = document.createElement('script');
  script.src = CONFIG.API_BASE + '/tracker/v1/tracker.js?v=' + CONFIG.VERSION;
  script.async = true;
  script.defer = true;
  
  // Set configuration for the main script
  script.setAttribute('data-config', JSON.stringify(CONFIG));
  
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
        siteId: site.id,
        siteName: site.name,
        trackerId: site.trackerId,
        nextJsScript: nextScriptFormat,
        scriptHtml: legacyScriptHtml,
        config: {
          API_BASE: apiBase,
          SITE_ID: site.trackerId,
          VERSION: "1.0.0",
          RETRY_ATTEMPTS: 3,
          TIMEOUT: 2000,
          UPDATE_INTERVAL: 500,
          MAX_INTERVAL_DURATION: 120000,
          FAST_MODE: true,
        },
        instructions: {
          nextJs:
            "For Next.js projects, copy the 'nextJsScript' code and paste it in your component. Make sure to import Script from 'next/script'.",
          legacy:
            "For other frameworks, copy the 'scriptHtml' code and paste it in your website's <head> section.",
          verification:
            "After installation, visit your website and check the browser console for 'Clever Search' messages to verify the script is working.",
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
        .where(eq(sites.id, req.params.siteId))
        .limit(1);
      const site = siteArr[0];

      if (!site || site.userId !== req.user!.userId) {
        res.status(404).json({ error: "Site not found" });
        return;
      }

      // Mock analytics data for now - in real implementation, query tracker_data and page_analytics tables
      const analyticsData = {
        overview: {
          totalViews: 1250,
          uniqueVisitors: 423,
          avgLoadTime: 1200,
          contentDeployments: 8,
          trendsPercentage: {
            views: 12.5,
            visitors: 8.3,
            loadTime: -5.2,
            deployments: 33.3,
          },
        },
        topPages: [
          {
            url: "/home",
            views: 456,
            avgLoadTime: 1100,
            bounceRate: 23,
            hasDeployedContent: true,
            lastOptimized: "2024-01-15",
          },
          {
            url: "/products",
            views: 334,
            avgLoadTime: 1250,
            bounceRate: 18,
            hasDeployedContent: true,
            lastOptimized: "2024-01-12",
          },
        ],
        contentPerformance: [
          {
            contentType: "title",
            deployedCount: 5,
            avgImprovementPercent: 23.5,
            topPerformingUrl: "/home",
            views: 890,
          },
          {
            contentType: "description",
            deployedCount: 3,
            avgImprovementPercent: 18.2,
            topPerformingUrl: "/products",
            views: 567,
          },
        ],
        recentActivity: [
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            type: "page_view",
            url: "/home",
          },
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            type: "content_injection",
            url: "/products",
          },
        ],
      };

      res.json(analyticsData);
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
