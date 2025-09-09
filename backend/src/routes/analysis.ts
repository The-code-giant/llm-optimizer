import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { AnalysisController } from '../controllers/AnalysisController';

const router = Router();
const analysisController = new AnalysisController();

/**
 * @openapi
 * /api/v1/analysis/pages/{pageId}:
 *   get:
 *     summary: Get analysis results for a specific page
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analysis results for the page
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/pages/:pageId', authenticateJWT, analysisController.getPageAnalysis);

/**
 * @openapi
 * /api/v1/analysis/pages/{pageId}/history:
 *   get:
 *     summary: Get analysis history for a page
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: pageId
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
 *     responses:
 *       200:
 *         description: Analysis history for the page
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/pages/:pageId/history', authenticateJWT, analysisController.getPageAnalysisHistory);

/**
 * @openapi
 * /api/v1/analysis/pages/{pageId}/trigger:
 *   post:
 *     summary: Trigger analysis for a specific page
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: pageId
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
 *               forceRefresh:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.post('/pages/:pageId/trigger', authenticateJWT, analysisController.triggerPageAnalysis);

/**
 * @openapi
 * /api/v1/analysis/pages/{pageId}/recommendations/{sectionType}:
 *   get:
 *     summary: Get recommendations for a specific section
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [title, description, headings, content, schema, images, links]
 *     responses:
 *       200:
 *         description: Section recommendations
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/pages/:pageId/recommendations/:sectionType', authenticateJWT, analysisController.getSectionRecommendations);

/**
 * @openapi
 * /api/v1/analysis/sites/{siteId}/stats:
 *   get:
 *     summary: Get overall analysis statistics for a site
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site analysis statistics
 *       404:
 *         description: Site not found or not authorized
 */
router.get('/sites/:siteId/stats', authenticateJWT, analysisController.getSiteAnalysisStats);

export default router;
