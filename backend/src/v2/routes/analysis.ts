import { Router } from 'express';
import { AnalysisControllerV2 } from '../controllers/AnalysisController';
import { authenticateJWT } from '../../middleware/auth';
import rateLimitMiddleware from '../../middleware/rateLimit';

const router = Router();
const analysisController = new AnalysisControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route POST /api/v2/analysis/pages/:pageId/enhanced
 * @desc Enhanced page analysis using Firecrawl
 * @access Private
 */
router.post(
  '/pages/:pageId/enhanced',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }), // 10 requests per 15 minutes
  analysisController.analyzePageEnhanced
);

/**
 * @route POST /api/v2/analysis/bulk/enhanced
 * @desc Bulk enhanced analysis for multiple pages
 * @access Private
 */
router.post(
  '/bulk/enhanced',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }), // 5 requests per 15 minutes
  analysisController.bulkAnalyzeEnhanced
);

/**
 * @route GET /api/v2/analysis/pages/:pageId/history
 * @desc Get enhanced analysis history for a page
 * @access Private
 */
router.get(
  '/pages/:pageId/history',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 }), // 30 requests per 15 minutes
  analysisController.getEnhancedAnalysisHistory
);

export default router;