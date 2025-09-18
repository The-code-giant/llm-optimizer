import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticateJWT } from '../../middleware/auth';

class ToolsControllerV2 extends BaseController {
  /**
   * Get available tools
   */
  getTools = async (req: Request, res: Response): Promise<void> => {
    try {
      this.success(res, {
        tools: [
          {
            name: 'Enhanced Page Analysis',
            description: 'Advanced content analysis using Firecrawl',
            endpoint: '/api/v2/analysis/pages/:pageId/enhanced'
          },
          {
            name: 'Competitive Intelligence',
            description: 'Analyze competitors and market trends',
            endpoint: '/api/v2/competitive/analyze'
          },
          {
            name: 'Bulk Content Processing',
            description: 'Process multiple pages simultaneously',
            endpoint: '/api/v2/analysis/bulk/enhanced'
          },
          {
            name: 'Advanced Analytics',
            description: 'Enhanced analytics dashboard with trends',
            endpoint: '/api/v2/analytics/dashboard'
          }
        ],
        version: '2.0'
      });
    } catch (error) {
      this.handleError(res, error, 'Get Tools');
    }
  };
}

const router = Router();
const toolsController = new ToolsControllerV2();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v2/tools
 * @desc Get available tools
 * @access Private
 */
router.get('/', toolsController.getTools);

export default router;