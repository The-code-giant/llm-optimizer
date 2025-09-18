import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticateJWT } from '../../middleware/auth';

class BillingControllerV2 extends BaseController {
  /**
   * Get billing status (placeholder for future Stripe integration)
   */
  getBillingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      this.success(res, {
        status: 'active',
        plan: 'pro',
        version: '2.0',
        message: 'V2 billing features coming soon'
      });
    } catch (error) {
      this.handleError(res, error, 'Get Billing Status');
    }
  };
}

const router = Router();
const billingController = new BillingControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/billing/status
 * @desc Get billing status
 * @access Private
 */
router.get('/status', billingController.getBillingStatus);

export default router;