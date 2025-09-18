import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticateJWT } from '../../middleware/auth';

class LeadsControllerV2 extends BaseController {
  /**
   * Get leads data
   */
  getLeads = async (req: Request, res: Response): Promise<void> => {
    try {
      this.success(res, {
        leads: [],
        total: 0,
        version: '2.0',
        message: 'V2 leads features coming soon'
      });
    } catch (error) {
      this.handleError(res, error, 'Get Leads');
    }
  };
}

const router = Router();
const leadsController = new LeadsControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/leads
 * @desc Get leads data
 * @access Private
 */
router.get('/', leadsController.getLeads);

export default router;