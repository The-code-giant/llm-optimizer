import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { SitesController } from '../controllers/SitesController';

const router = Router();
const sitesController = new SitesController();

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
 */
router.post('/', authenticateJWT, sitesController.createSite);

/**
 * @openapi
 * /api/v1/sites:
 *   get:
 *     summary: Get all sites for the authenticated user
 *     tags: [Sites]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: List of sites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Site'
 *                 pagination:
 *                   type: object
 */
router.get('/', authenticateJWT, sitesController.getSites);

/**
 * @openapi
 * /api/v1/sites/{siteId}:
 *   get:
 *     summary: Get a specific site by ID
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
router.get('/:siteId', authenticateJWT, sitesController.getSite);

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
 *               url:
 *                 type: string
 *                 format: uri
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Site updated successfully
 *       404:
 *         description: Site not found
 */
router.put('/:siteId', authenticateJWT, sitesController.updateSite);

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
 *       200:
 *         description: Site deleted successfully
 *       404:
 *         description: Site not found
 */
router.delete('/:siteId', authenticateJWT, sitesController.deleteSite);

/**
 * @openapi
 * /api/v1/sites/{siteId}/sitemap/import:
 *   post:
 *     summary: Import sitemap for a site
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
 *     responses:
 *       202:
 *         description: Sitemap import started
 *       404:
 *         description: Site not found
 */
router.post('/:siteId/sitemap/import', authenticateJWT, sitesController.importSitemap);

/**
 * @openapi
 * /api/v1/sites/{siteId}/pages:
 *   get:
 *     summary: Get pages for a site
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, score, lastAnalysis, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: scoreFilter
 *         schema:
 *           type: string
 *           enum: [all, high, medium, low]
 *           default: all
 *     responses:
 *       200:
 *         description: List of pages for the site
 *       404:
 *         description: Site not found
 */
router.get('/:siteId/pages', authenticateJWT, sitesController.getSitePages);

/**
 * @openapi
 * /api/v1/sites/{siteId}/pages:
 *   post:
 *     summary: Create a new page for a site
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
 *         description: Page created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       400:
 *         description: Invalid input or page already exists
 *       404:
 *         description: Site not found
 */
router.post('/:siteId/pages', authenticateJWT, sitesController.createPage);

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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               forceRefresh:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       202:
 *         description: Bulk analysis started
 *       404:
 *         description: Site not found
 */
router.post('/:siteId/analysis', authenticateJWT, sitesController.triggerSiteAnalysis);

/**
 * @openapi
 * /api/v1/sites/{siteId}/analytics:
 *   get:
 *     summary: Get site analytics summary
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site analytics data
 *       404:
 *         description: Site not found
 */
router.get('/:siteId/analytics', authenticateJWT, sitesController.getSiteAnalytics);

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
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [nextjs, react, vanilla, wordpress]
 *           default: nextjs
 *     responses:
 *       200:
 *         description: Tracking script HTML and platform-specific format
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
router.get('/:siteId/tracker-script', authenticateJWT, sitesController.getTrackerScript);

/**
 * @openapi
 * /api/v1/sites/{siteId}/check-tracker:
 *   post:
 *     summary: Check if tracker script is installed on a site
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracker installation check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     siteId:
 *                       type: string
 *                     url:
 *                       type: string
 *                     trackerId:
 *                       type: string
 *                     isInstalled:
 *                       type: boolean
 *                     checkedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid site ID format
 *       404:
 *         description: Site not found
 *       500:
 *         description: Failed to check tracker installation
 */
router.post('/:siteId/check-tracker', authenticateJWT, sitesController.checkTrackerInstallation);

/**
 *   get:
 *     summary: Get demographics analytics for a site
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *     responses:
 *       200:
 *         description: Demographics analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: object
 *                 browsers:
 *                   type: object
 *                 countries:
 *                   type: object
 *                 timeRange:
 *                   type: string
 *       404:
 *         description: Site not found
 */
router.get('/:siteId/analytics/demographics', authenticateJWT, sitesController.getDemographicsAnalytics);

/**
 * @openapi
 * /api/v1/sites/{siteId}/analytics/page-performance:
 *   get:
 *     summary: Get page performance analytics for a site
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *     responses:
 *       200:
 *         description: Page performance analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topPages:
 *                   type: array
 *                 performanceMetrics:
 *                   type: object
 *                 timeRange:
 *                   type: string
 *       404:
 *         description: Site not found
 */
router.get('/:siteId/analytics/page-performance', authenticateJWT, sitesController.getPagePerformanceAnalytics);

/**
 * @openapi
 * /api/v1/sites/pre-submit:
 *   post:
 *     summary: Submit website URL for pre-signup analysis
 *     tags: [Sites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *             required:
 *               - url
 *     responses:
 *       200:
 *         description: Website URL submitted successfully
 *       400:
 *         description: Invalid URL format
 */
router.post('/pre-submit', sitesController.preSubmitWebsite);

export default router;
