import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { PagesController } from '../controllers/PagesController';

const router = Router();
const pagesController = new PagesController();

/**
 * @openapi
 * /api/v1/pages/{pageId}:
 *   get:
 *     summary: Get page details
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/:pageId', authenticateJWT, pagesController.getPage);

/**
 * @openapi
 * /api/v1/pages/{pageId}/analysis:
 *   get:
 *     summary: Get the latest analysis result for a page
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest analysis result for the page
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/:pageId/analysis', authenticateJWT, pagesController.getPageAnalysis);

/**
 * @openapi
 * /api/v1/pages/{pageId}/analysis:
 *   post:
 *     summary: Trigger analysis for a page
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forceRefresh:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.post('/:pageId/analysis', authenticateJWT, pagesController.triggerPageAnalysis);

/**
 * @openapi
 * /api/v1/pages/{pageId}/content:
 *   post:
 *     summary: Save optimized content for a page
 *     tags: [Page Content]
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
 *             required: [contentType, optimizedContent]
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [title, description, faq, paragraph, keywords, schema]
 *               originalContent:
 *                 type: string
 *               optimizedContent:
 *                 type: string
 *               generationContext:
 *                 type: string
 *               metadata:
 *                 type: object
 *               deployImmediately:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Content saved successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.post('/:pageId/content', authenticateJWT, pagesController.savePageContent);

/**
 * @openapi
 * /api/v1/pages/{pageId}/content:
 *   get:
 *     summary: Get optimized content for a page
 *     tags: [Page Content]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [title, description, faq, paragraph, keywords]
 *     responses:
 *       200:
 *         description: Page content retrieved successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/:pageId/content', authenticateJWT, pagesController.getPageContent);

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-ratings:
 *   get:
 *     summary: Get section ratings and recommendations for a page
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section ratings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pageId:
 *                   type: string
 *                 sectionRatings:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: number
 *                     description:
 *                       type: number
 *                     headings:
 *                       type: number
 *                     content:
 *                       type: number
 *                     schema:
 *                       type: number
 *                     images:
 *                       type: number
 *                     links:
 *                       type: number
 *                 sectionRecommendations:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: array
 *                       items:
 *                         type: string
 *                     description:
 *                       type: array
 *                       items:
 *                         type: string
 *                     headings:
 *                       type: array
 *                       items:
 *                         type: string
 *                     content:
 *                       type: array
 *                       items:
 *                         type: string
 *                     schema:
 *                       type: array
 *                       items:
 *                         type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                     links:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid page ID format
 *       404:
 *         description: Page not found
 *       403:
 *         description: Not authorized
 */
router.get('/:pageId/section-ratings', authenticateJWT, pagesController.getSectionRatings);

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-ratings:
 *   post:
 *     summary: Update section rating after content deployment
 *     tags: [Pages]
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
 *             required: [sectionType, newScore, deployedContent]
 *             properties:
 *               sectionType:
 *                 type: string
 *                 enum: [title, description, headings, content, schema, images, links]
 *               newScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *               deployedContent:
 *                 type: string
 *               aiModel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Section rating updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sectionType:
 *                   type: string
 *                 previousScore:
 *                   type: number
 *                 newScore:
 *                   type: number
 *                 scoreImprovement:
 *                   type: number
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Page not found
 *       403:
 *         description: Not authorized
 */
router.post('/:pageId/section-ratings', authenticateJWT, pagesController.updateSectionRating);

/**
 * @openapi
 * /api/v1/pages/{pageId}/original-content:
 *   get:
 *     summary: Get original page content
 *     tags: [Page Content]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Original page content retrieved successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/:pageId/original-content', authenticateJWT, pagesController.getOriginalPageContent);

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-content:
 *   post:
 *     summary: Generate optimized content for selected section recommendations
 *     tags: [Content Generation]
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
 *             required: [sectionType, selectedRecommendations]
 *             properties:
 *               sectionType:
 *                 type: string
 *                 enum: [title, description, headings, content, schema, images, links]
 *               selectedRecommendations:
 *                 type: array
 *                 items:
 *                   type: string
 *               currentContent:
 *                 type: string
 *               additionalContext:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content generated successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.post('/:pageId/section-content', authenticateJWT, pagesController.generateSectionContent);

/**
 * @openapi
 * /api/v1/pages/{pageId}:
 *   delete:
 *     summary: Delete a page
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedPageId:
 *                   type: string
 *                 deletedRecords:
 *                   type: object
 *                   properties:
 *                     contentAnalysis:
 *                       type: number
 *                     contentSuggestions:
 *                       type: number
 *                     pageAnalytics:
 *                       type: number
 *       400:
 *         description: Invalid page ID format
 *       404:
 *         description: Page not found
 *       403:
 *         description: Not authorized
 */
router.delete('/:pageId', authenticateJWT, pagesController.deletePage);

/**
 * @openapi
 * /api/v1/pages/{pageId}/content-suggestions:
 *   get:
 *     summary: Get cached content suggestions for a page
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [title, description, faq, paragraph, keywords]
 *     responses:
 *       200:
 *         description: Cached content suggestions
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/:pageId/content-suggestions', authenticateJWT, pagesController.getContentSuggestions);

/**
 * @openapi
 * /api/v1/pages/{pageId}/content-suggestions:
 *   post:
 *     summary: Generate new content suggestions for a page
 *     tags: [Pages]
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
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [title, description, faq, paragraph, keywords]
 *               currentContent:
 *                 type: string
 *               additionalContext:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated content suggestions
 *       404:
 *         description: Page not found or not authorized
 */
router.post('/:pageId/content-suggestions', authenticateJWT, pagesController.generateContentSuggestions);

/**
 * @openapi
 * /api/v1/pages/{pageId}/deployed-content:
 *   get:
 *     summary: Get all deployed content for a page
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deployed content for the page
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/:pageId/deployed-content', authenticateJWT, pagesController.getDeployedContent);

/**
 * @openapi
 * /api/v1/pages/{pageId}/refresh-content:
 *   post:
 *     summary: Refresh page content from live URL
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page content refreshed successfully
 *       404:
 *         description: Page not found or not authorized
 */
router.post('/:pageId/refresh-content', authenticateJWT, pagesController.refreshPageContent);

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-improvements:
 *   get:
 *     summary: Get section improvements for a page
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sectionType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section improvements for the page
 *       404:
 *         description: Page not found or not authorized
 */
router.get('/:pageId/section-improvements', authenticateJWT, pagesController.getSectionImprovements);

export default router;
