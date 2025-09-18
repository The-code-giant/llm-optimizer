import { Router } from 'express';
import { SitesControllerV2 } from '../controllers/SitesController';
import { authenticateJWT } from '../../middleware/auth';
import rateLimitMiddleware from '../../middleware/rateLimit';

const router = Router();
const sitesController = new SitesControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/sites
 * @desc Get all sites for user
 * @access Private
 */
router.get(
  '/',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 60 }),
  sitesController.getSites
);

/**
 * @route GET /api/v2/sites/:siteId
 * @desc Get single site with detailed metrics
 * @access Private
 */
router.get(
  '/:siteId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 60 }),
  sitesController.getSite
);

/**
 * @route POST /api/v2/sites
 * @desc Create new site with enhanced discovery
 * @access Private
 */
router.post(
  '/',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }),
  sitesController.createSite
);

/**
 * @route PUT /api/v2/sites/:siteId
 * @desc Update site
 * @access Private
 */
router.put(
  '/:siteId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 }),
  sitesController.updateSite
);

/**
 * @route DELETE /api/v2/sites/:siteId
 * @desc Delete site (soft delete)
 * @access Private
 */
router.delete(
  '/:siteId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }),
  sitesController.deleteSite
);

/**
 * @route POST /api/v2/sites/:siteId/discover
 * @desc Discover pages using Firecrawl (competitive intelligence)
 * @access Private
 */
router.post(
  '/:siteId/discover',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }),
  sitesController.discoverPages
);

/**
 * @route POST /api/v2/sites/:siteId/rediscover
 * @desc Rediscover pages for an existing site using Firecrawl
 * @access Private
 */
router.post(
  '/:siteId/rediscover',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 3 }),
  sitesController.rediscoverPages
);

/**
 * @route POST /api/v2/sites/:siteId/metrics/update
 * @desc Update site metrics manually
 * @access Private
 */
router.post(
  '/:siteId/metrics/update',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20 }),
  sitesController.updateMetrics
);

export default router;