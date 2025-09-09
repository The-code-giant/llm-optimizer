import { Router } from 'express';
import { TrackerController } from '../controllers/TrackerController';
import { trackerRateLimit } from '../middleware/rateLimit';

const router = Router();
const trackerController = new TrackerController();

/**
 * @openapi
 * /api/v1/tracker/{trackerId}/data:
 *   post:
 *     summary: Collect tracking data from client-side script
 *     tags: [Tracker]
 *     parameters:
 *       - in: path
 *         name: trackerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pageUrl, eventType]
 *             properties:
 *               pageUrl:
 *                 type: string
 *                 format: uri
 *               eventType:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               sessionId:
 *                 type: string
 *               anonymousUserId:
 *                 type: string
 *               eventData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Data received successfully
 *       400:
 *         description: Invalid tracking data
 */
router.post('/:trackerId/data', trackerRateLimit, trackerController.collectData);

/**
 * @openapi
 * /api/v1/tracker/{trackerId}/content:
 *   get:
 *     summary: Fetch injected content for a page (Enhanced with Redis caching)
 *     tags: [Tracker]
 *     parameters:
 *       - in: path
 *         name: trackerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageUrl
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *     responses:
 *       200:
 *         description: List of injected content for the page
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   content:
 *                     type: string
 *       400:
 *         description: Missing or invalid pageUrl
 *       404:
 *         description: Site not found
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/:trackerId/content', trackerRateLimit, trackerController.getContent);

export default router;
