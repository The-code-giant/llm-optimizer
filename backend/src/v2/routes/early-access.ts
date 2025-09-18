import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticateJWT } from '../../middleware/auth';

class EarlyAccessControllerV2 extends BaseController {
  /**
   * Get early access features
   */
  getFeatures = async (req: Request, res: Response): Promise<void> => {
    try {
      this.success(res, {
        features: [
          'Enhanced Firecrawl Analysis',
          'Competitive Intelligence',
          'Advanced Analytics Dashboard',
          'Bulk Page Processing'
        ],
        version: '2.0',
        enabled: true
      });
    } catch (error) {
      this.handleError(res, error, 'Get Early Access Features');
    }
  };
}

const router = Router();
const earlyAccessController = new EarlyAccessControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/early-access/features
 * @desc Get early access features
 * @access Private
 */
router.get('/features', earlyAccessController.getFeatures);

export default router;