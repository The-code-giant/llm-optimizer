import { Router } from 'express';
import { AnalyticsControllerV2 } from '../controllers/AnalyticsController';
import { authenticateJWT } from '../../middleware/auth';
import rateLimitMiddleware from '../../middleware/rateLimit';

const router = Router();
const analyticsController = new AnalyticsControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/analytics/dashboard
 * @desc Get enhanced analytics dashboard data
 * @access Private
 */
router.get(
  '/dashboard',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 60 }),
  analyticsController.getDashboard
);

/**
 * @route GET /api/v2/analytics/sites/:siteId
 * @desc Get detailed site analytics
 * @access Private
 */
router.get(
  '/sites/:siteId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 }),
  analyticsController.getSiteAnalytics
);

/**
 * @route GET /api/v2/analytics/sites/:siteId/comparison
 * @desc Get comparison analytics between periods
 * @access Private
 */
router.get(
  '/sites/:siteId/comparison',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20 }),
  analyticsController.getComparisonAnalytics
);

export default router;