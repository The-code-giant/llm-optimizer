import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticateJWT } from '../../middleware/auth';

class AuthControllerV2 extends BaseController {
  /**
   * Get user profile (Clerk integration)
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // User profile is already available through Clerk middleware
      const user = (req as any).user;
      
      this.success(res, {
        user,
        version: '2.0'
      });
    } catch (error) {
      this.handleError(res, error, 'Get User Profile');
    }
  };
}

const router = Router();
const authController = new AuthControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', authController.getProfile);

export default router;