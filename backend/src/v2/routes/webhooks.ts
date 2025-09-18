import { Router } from 'express';
import { Request, Response } from 'express';
import { BaseController } from '../controllers/BaseController';

class WebhooksControllerV2 extends BaseController {
  /**
   * Handle Firecrawl webhooks
   */
  handleFirecrawlWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { event, data } = req.body;
      
      // Process webhook based on event type
      switch (event) {
        case 'crawl.completed':
          // Handle completed crawl
          break;
        case 'crawl.failed':
          // Handle failed crawl
          break;
        default:
          console.log('Unknown webhook event:', event);
      }
      
      this.success(res, { received: true });
    } catch (error) {
      this.handleError(res, error, 'Firecrawl Webhook');
    }
  };

  /**
   * Handle Stripe webhooks
   */
  handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, data } = req.body;
      
      // Process webhook based on type
      switch (type) {
        case 'invoice.payment_succeeded':
          // Handle successful payment
          break;
        case 'customer.subscription.updated':
          // Handle subscription update
          break;
        default:
          console.log('Unknown Stripe webhook type:', type);
      }
      
      this.success(res, { received: true });
    } catch (error) {
      this.handleError(res, error, 'Stripe Webhook');
    }
  };
}

const router = Router();
const webhooksController = new WebhooksControllerV2();

/**
 * @route POST /api/v2/webhooks/firecrawl
 * @desc Handle Firecrawl webhooks
 * @access Public (with signature verification in production)
 */
router.post('/firecrawl', webhooksController.handleFirecrawlWebhook);

/**
 * @route POST /api/v2/webhooks/stripe
 * @desc Handle Stripe webhooks
 * @access Public (with signature verification in production)
 */
router.post('/stripe', webhooksController.handleStripeWebhook);

export default router;