import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ContentController } from '../controllers/ContentController';

const router = Router();
const contentController = new ContentController();

/**
 * @openapi
 * /api/v1/content/sites/{siteId}:
 *   get:
 *     summary: Get all injected content for a site
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [contentType, version, deployedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of injected content for the site
 *       404:
 *         description: Site not found or not authorized
 */
router.get('/sites/:siteId', authenticateJWT, contentController.getSiteContent);

/**
 * @openapi
 * /api/v1/content/{contentId}:
 *   get:
 *     summary: Get specific content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content details
 *       404:
 *         description: Content not found or not authorized
 */
router.get('/:contentId', authenticateJWT, contentController.getContent);

/**
 * @openapi
 * /api/v1/content/pages/{pageId}:
 *   post:
 *     summary: Create new content for a page
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, content]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [faq, schema, custom_html, paragraph, keywords]
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Content created successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.post('/pages/:pageId', authenticateJWT, contentController.createContent);

/**
 * @openapi
 * /api/v1/content/{contentId}:
 *   put:
 *     summary: Update existing content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       404:
 *         description: Content not found or not authorized
 */
router.put('/:contentId', authenticateJWT, contentController.updateContent);

/**
 * @openapi
 * /api/v1/content/{contentId}:
 *   delete:
 *     summary: Delete content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *       404:
 *         description: Content not found or not authorized
 */
router.delete('/:contentId', authenticateJWT, contentController.deleteContent);

/**
 * @openapi
 * /api/v1/content/{contentId}/deploy:
 *   post:
 *     summary: Deploy/activate content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content deployed successfully
 *       404:
 *         description: Content not found or not authorized
 */
router.post('/:contentId/deploy', authenticateJWT, contentController.deployContent);

/**
 * @openapi
 * /api/v1/content/{contentId}/undeploy:
 *   post:
 *     summary: Undeploy/deactivate content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content undeployed successfully
 *       404:
 *         description: Content not found or not authorized
 */
router.post('/:contentId/undeploy', authenticateJWT, contentController.undeployContent);

export default router;
