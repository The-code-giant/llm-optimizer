import { Router } from 'express';
import { TrackerControllerV2 } from '../controllers/TrackerController';
import { authenticateJWT } from '../../middleware/auth';
import rateLimitMiddleware from '../../middleware/rateLimit';

const router = Router();
const trackerController = new TrackerControllerV2();

/**
 * @route GET /api/v2/tracker/:trackerId/script.js
 * @desc Get tracker script for a site (public endpoint)
 * @access Public
 */
router.get(
  '/:trackerId/script.js',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 1000 }),
  trackerController.getTrackerScript
);

/**
 * @route POST /api/v2/tracker/:trackerId/track
 * @desc Track page view (called by the tracker script - public endpoint)
 * @access Public
 */
router.post(
  '/:trackerId/track',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10000 }),
  trackerController.trackPageView
);

/**
 * @route GET /api/v2/tracker/:trackerId/pixel.gif
 * @desc Track page view via image pixel (fallback - public endpoint)
 * @access Public
 */
router.get(
  '/:trackerId/pixel.gif',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10000 }),
  trackerController.trackPageView
);

// Protected routes (require authentication)
router.use(authenticateJWT);

/**
 * @route GET /api/v2/tracker/sites/:siteId/config
 * @desc Get tracker configuration
 * @access Private
 */
router.get(
  '/sites/:siteId/config',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 60 }),
  trackerController.getTrackerConfig
);

/**
 * @route PUT /api/v2/tracker/sites/:siteId/settings
 * @desc Update tracker settings
 * @access Private
 */
router.put(
  '/sites/:siteId/settings',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 }),
  trackerController.updateTrackerSettings
);

/**
 * @route POST /api/v2/tracker/sites/:siteId/regenerate
 * @desc Regenerate tracker ID (for security)
 * @access Private
 */
router.post(
  '/sites/:siteId/regenerate',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }),
  trackerController.regenerateTrackerId
);

/**
 * @route GET /api/v2/tracker/sites/:siteId/stats
 * @desc Get tracker analytics/stats
 * @access Private
 */
router.get(
  '/sites/:siteId/stats',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 60 }),
  trackerController.getTrackerStats
);

export default router;