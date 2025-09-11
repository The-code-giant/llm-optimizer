import express from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();
const analyticsController = new AnalyticsController();

/**
 * @openapi
 * /api/v1/analytics/{siteId}/overview:
 *   get:
 *     summary: Get analytics overview for a site
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *     responses:
 *       200:
 *         description: Analytics overview data
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalViews:
 *                           type: number
 *                         uniqueVisitors:
 *                           type: number
 *                         avgLoadTime:
 *                           type: number
 *                         contentDeployments:
 *                           type: number
 *                     topPages:
 *                       type: array
 *                     timeSeriesData:
 *                       type: array
 *       404:
 *         description: Site not found
 */
router.get('/:siteId/overview', authenticateJWT, analyticsController.getOverview);

/**
 * @openapi
 * /api/v1/analytics/{siteId}/demographics:
 *   get:
 *     summary: Get demographics analytics for a site
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     trafficSources:
 *                       type: array
 *                     deviceBreakdown:
 *                       type: object
 *                     browserBreakdown:
 *                       type: object
 *       404:
 *         description: Site not found
 */
router.get('/:siteId/demographics', authenticateJWT, analyticsController.getDemographics);

/**
 * @openapi
 * /api/v1/analytics/{siteId}/page-performance:
 *   get:
 *     summary: Get page performance analytics for a site
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagePerformance:
 *                       type: array
 *                     performanceMetrics:
 *                       type: object
 *       404:
 *         description: Site not found
 */
router.get('/:siteId/page-performance', authenticateJWT, analyticsController.getPagePerformance);

export default router;
