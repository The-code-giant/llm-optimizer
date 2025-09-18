import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController, AuthenticatedRequest } from '../controllers/BaseController';
import { CompetitiveIntelligenceService } from '../services/CompetitiveIntelligenceService';
import { authenticateJWT } from '../../middleware/auth';
import rateLimitMiddleware from '../../middleware/rateLimit';

class CompetitiveIntelligenceController extends BaseController {
  private competitiveService: CompetitiveIntelligenceService;

  constructor() {
    super();
    this.competitiveService = new CompetitiveIntelligenceService();
  }

  /**
   * Analyze competitors for a given query
   */
  analyzeCompetitors = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, maxCompetitors = 10, includeDomains = [], excludeDomains = [], language = 'en', location = 'US' } = req.body;

      if (!query) {
        return this.error(res, 'Query is required for competitive analysis', 400);
      }

      const report = await this.competitiveService.analyzeCompetitors(query, {
        maxCompetitors: Math.min(maxCompetitors, 15), // Safety limit
        includeDomains,
        excludeDomains,
        language,
        location
      });

      this.success(res, report, 'Competitive intelligence analysis completed');

    } catch (error) {
      this.handleError(res, error, 'Competitive Intelligence Analysis');
    }
  };

  /**
   * Analyze a single competitor
   */
  analyzeSingleCompetitor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.body;

      if (!url) {
        return this.error(res, 'Competitor URL is required', 400);
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return this.error(res, 'Invalid URL format', 400);
      }

      const analysis = await this.competitiveService.analyzeCompetitor({
        url,
        title: '',
        content: '',
        metadata: {}
      });

      this.success(res, analysis, 'Competitor analysis completed');

    } catch (error) {
      this.handleError(res, error, 'Single Competitor Analysis');
    }
  };
}

const router = Router();
const competitiveController = new CompetitiveIntelligenceController();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route POST /api/v2/competitive/analyze
 * @desc Analyze competitors for a given query
 * @access Private
 */
router.post(
  '/analyze',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 3 }), // Very limited due to API costs
  competitiveController.analyzeCompetitors
);

/**
 * @route POST /api/v2/competitive/analyze-single
 * @desc Analyze a single competitor
 * @access Private
 */
router.post(
  '/analyze-single',
  rateLimitMiddleware.createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }),
  competitiveController.analyzeSingleCompetitor
);

export default router;