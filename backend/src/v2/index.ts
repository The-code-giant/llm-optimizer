import { Router } from 'express';
import { Request, Response } from 'express';

// Import all v2 route modules
import analysisRoutes from './routes/analysis';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import billingRoutes from './routes/billing';
import competitiveRoutes from './routes/competitive';
import earlyAccessRoutes from './routes/early-access';
import leadsRoutes from './routes/leads';
import pagesRoutes from './routes/pages';
import sitesRoutes from './routes/sites';
import toolsRoutes from './routes/tools';
import trackerRoutes from './routes/tracker';
import usersRoutes from './routes/users';
import webhooksRoutes from './routes/webhooks';

const router = Router();

/**
 * @route GET /api/v2/
 * @desc API v2 status endpoint
 * @access Public
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Cleversearch API v2.0 - Enhanced with Firecrawl Integration',
    version: '2.0.0',
    features: [
      'Enhanced content analysis with Firecrawl',
      'Competitive intelligence',
      'Advanced analytics dashboard',
      'Bulk processing capabilities',
      'Improved tracker system'
    ],
    endpoints: {
      analysis: '/api/v2/analysis',
      analytics: '/api/v2/analytics',
      auth: '/api/v2/auth',
      billing: '/api/v2/billing',
      competitive: '/api/v2/competitive',
      earlyAccess: '/api/v2/early-access',
      leads: '/api/v2/leads',
      pages: '/api/v2/pages',
      sites: '/api/v2/sites',
      tools: '/api/v2/tools',
      tracker: '/api/v2/tracker',
      users: '/api/v2/users',
      webhooks: '/api/v2/webhooks'
    },
    compatibility: {
      v1: 'All v1 endpoints remain fully functional',
      migration: 'V2 provides enhanced features alongside existing functionality'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/v2/health
 * @desc API v2 health check
 * @access Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      firecrawl: process.env.FIRECRAWL_API_KEY ? 'configured' : 'not configured',
      auth: 'active'
    }
  });
});

// Mount all route modules
router.use('/analysis', analysisRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/auth', authRoutes);
router.use('/billing', billingRoutes);
router.use('/competitive', competitiveRoutes);
router.use('/early-access', earlyAccessRoutes);
router.use('/leads', leadsRoutes);
router.use('/pages', pagesRoutes);
router.use('/sites', sitesRoutes);
router.use('/tools', toolsRoutes);
router.use('/tracker', trackerRoutes);
router.use('/users', usersRoutes);
router.use('/webhooks', webhooksRoutes);

// 404 handler for v2 API
router.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'V2 API endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist in API v2.0`,
    availableEndpoints: [
      '/api/v2/analysis',
      '/api/v2/analytics', 
      '/api/v2/auth',
      '/api/v2/billing',
      '/api/v2/competitive',
      '/api/v2/early-access',
      '/api/v2/leads',
      '/api/v2/pages',
      '/api/v2/sites',
      '/api/v2/tools',
      '/api/v2/tracker',
      '/api/v2/users',
      '/api/v2/webhooks'
    ],
    version: '2.0.0'
  });
});

export default router;