import { Router } from 'express';
import { PagesControllerV2 } from '../controllers/PagesController';
import { authenticateJWT } from '../../middleware/auth';
import rateLimitMiddleware from '../../middleware/rateLimit';

const router = Router();
const pagesController = new PagesControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/pages/sites/:siteId
 * @desc Get pages with enhanced content using Firecrawl
 * @access Private
 */
router.get(
  '/sites/:siteId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 60 }),
  pagesController.getPages
);

/**
 * @route POST /api/v2/pages/sites/:siteId
 * @desc Create or update page with enhanced content extraction
 * @access Private
 */
router.post(
  '/sites/:siteId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20 }),
  pagesController.createOrUpdatePage
);

/**
 * @route GET /api/v2/pages/sites/:siteId/pages/:pageId
 * @desc Get page details with all analysis history
 * @access Private
 */
router.get(
  '/sites/:siteId/pages/:pageId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 60 }),
  pagesController.getPageDetails
);

/**
 * @route PUT /api/v2/pages/sites/:siteId/bulk
 * @desc Bulk update pages with content extraction
 * @access Private
 */
router.put(
  '/sites/:siteId/bulk',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }),
  pagesController.bulkUpdatePages
);

/**
 * @route DELETE /api/v2/pages/sites/:siteId/pages/:pageId
 * @desc Delete page
 * @access Private
 */
router.delete(
  '/sites/:siteId/pages/:pageId',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 }),
  pagesController.deletePage
);

export default router;