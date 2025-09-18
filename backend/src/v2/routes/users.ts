import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticateJWT } from '../../middleware/auth';

class UsersControllerV2 extends BaseController {
  /**
   * Get user profile and settings
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      
      this.success(res, {
        user,
        settings: {
          defaultAnalysisType: 'enhanced',
          enableCompetitiveIntelligence: true,
          autoPageDiscovery: false
        },
        version: '2.0'
      });
    } catch (error) {
      this.handleError(res, error, 'Get User Profile');
    }
  };

  /**
   * Update user settings
   */
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { settings } = req.body;
      
      // In a real implementation, save settings to database
      this.success(res, {
        settings,
        updated: true,
        version: '2.0'
      }, 'Settings updated successfully');
    } catch (error) {
      this.handleError(res, error, 'Update User Settings');
    }
  };
}

const router = Router();
const usersController = new UsersControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/users/profile
 * @desc Get user profile and settings
 * @access Private
 */
router.get('/profile', usersController.getProfile);

/**
 * @route PUT /api/v2/users/settings
 * @desc Update user settings
 * @access Private
 */
router.put('/settings', usersController.updateSettings);

export default router;