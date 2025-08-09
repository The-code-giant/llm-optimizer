import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, analysisResults, pageContent, contentSuggestions, pageInjectedContent, pageAnalytics } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';
import { AnalysisService } from '../utils/analysisService';
import OpenAI from 'openai';
import cache from '../utils/cache';

// Extend Express Request type to include user
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

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
// Get page details
router.get('/:pageId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }
    res.json(page);
  } catch (err) {
    next(err);
  }
});

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 pageId:
 *                   type: string
 *                 summary:
 *                   type: string
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                 createdAt:
 *                   type: string
 *       404:
 *         description: Page not found or no analysis available
 */
// Get latest analysis result for a page
router.get('/:pageId/analysis', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }
    
    // Get the latest analysis result for this page
    const analysisArr = await db.select()
      .from(analysisResults)
      .where(eq(analysisResults.pageId, req.params.pageId))
      .orderBy(desc(analysisResults.createdAt))
      .limit(1);
    
    if (analysisArr.length === 0) {
      res.status(404).json({ message: 'No analysis found for this page' });
      return;
    }
    
    const analysis = analysisArr[0];
    
    // Map database result to frontend interface
    let recommendations: string[] = [];
    let issues: string[] = [];
    
    if (analysis.recommendations) {
      // Handle different possible formats of recommendations JSON
      try {
        const recsData = analysis.recommendations as any;
        if (Array.isArray(recsData)) {
          recommendations = recsData;
        } else if (recsData.recommendations && Array.isArray(recsData.recommendations)) {
          recommendations = recsData.recommendations;
        } else if (recsData.issues && Array.isArray(recsData.issues)) {
          issues = recsData.issues;
          recommendations = recsData.recommendations || [];
        }
      } catch (e) {
        recommendations = ['Analysis data could not be parsed'];
      }
    }
    
    const result = {
      id: analysis.id,
      pageId: analysis.pageId,
      summary: analysis.rawLlmOutput || 'No summary available',
      issues: issues,
      recommendations: recommendations,
      createdAt: analysis.createdAt?.toISOString() || '',
    };
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

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
 *     responses:
 *       200:
 *         description: Analysis triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
 *                   type: string
 *       404:
 *         description: Page not found or not authorized
 */
// Trigger analysis for a page
router.post('/:pageId/analysis', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ 
        message: 'Analysis service not configured. Please add OPENAI_API_KEY to environment variables.' 
      });
      return;
    }
    
    console.log(`🚀 Starting analysis for page: ${page.url}`);
    
    try {
      // Check if forced refresh is requested
      const forceRefresh = req.body?.forceRefresh === true || req.query?.forceRefresh === 'true';
      
      // Perform the actual analysis
      const analysisResult = await AnalysisService.analyzePage({
        url: page.url,
        contentSnapshot: page.contentSnapshot || undefined,
        forceRefresh
      });

      // Always update the content snapshot after analysis (especially if it was refreshed)
      await db.update(pages)
        .set({ 
          contentSnapshot: JSON.stringify(analysisResult.content),
          title: analysisResult.content.title || page.title,
          llmReadinessScore: analysisResult.score,
          lastAnalysisAt: new Date(),
          lastScannedAt: new Date()
        })
        .where(eq(pages.id, page.id));

      // Store analysis results in database (including AI page summary)
      const newAnalysis = await db.insert(analysisResults).values({
        pageId: page.id,
        analyzedAt: new Date(),
        llmModelUsed: 'gpt-4o-mini',
        score: analysisResult.score,
        recommendations: JSON.stringify({
          issues: analysisResult.issues,
          recommendations: analysisResult.recommendations,
          summary: analysisResult.summary,
          pageSummary: analysisResult.pageSummary, // Store AI page summary
          contentQuality: analysisResult.contentQuality,
          technicalSEO: analysisResult.technicalSEO,
          keywordAnalysis: analysisResult.keywordAnalysis,
          llmOptimization: analysisResult.llmOptimization
        }),
        rawLlmOutput: JSON.stringify(analysisResult),
      }).returning();

      console.log(`✅ Analysis completed for ${page.url} - Score: ${analysisResult.score}/100`);

      // Return the analysis results immediately
      res.json({
        message: 'Analysis completed successfully',
        analysis: {
          id: newAnalysis[0].id,
          pageId: page.id,
          summary: analysisResult.summary,
          issues: analysisResult.issues,
          recommendations: analysisResult.recommendations,
          score: analysisResult.score,
          createdAt: newAnalysis[0].createdAt?.toISOString(),
        }
      });
    } catch (analysisError: any) {
      console.error(`❌ Analysis failed for ${page.url}:`, analysisError);
      res.status(500).json({ 
        message: 'Analysis failed', 
        error: analysisError.message || 'Unknown error occurred during analysis'
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/refresh-content:
 *   post:
 *     summary: Force refresh page content from the live URL
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 content:
 *                   type: object
 *                 contentSnapshot:
 *                   type: string
 */
// Force refresh page content from URL
router.post('/:pageId/refresh-content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    console.log(`🔄 Force refreshing content for page: ${page.url}`);
    
    try {
      // Fetch fresh content directly
      const freshContent = await AnalysisService.fetchPageContent(page.url);
      
      // Update page with fresh content
      await db.update(pages)
        .set({ 
          contentSnapshot: JSON.stringify(freshContent),
          title: freshContent.title || page.title,
          lastScannedAt: new Date()
        })
        .where(eq(pages.id, page.id));

      console.log(`✅ Content refreshed for ${page.url}`);

      res.json({
        message: 'Content refreshed successfully',
        content: freshContent,
        contentSnapshot: JSON.stringify(freshContent),
        refreshedAt: new Date().toISOString()
      });
    } catch (fetchError: any) {
      console.error(`❌ Content refresh failed for ${page.url}:`, fetchError);
      res.status(500).json({ 
        message: 'Content refresh failed', 
        error: fetchError.message || 'Unknown error occurred while fetching content'
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/content-suggestions:
 *   post:
 *     summary: Generate AI content suggestions for a page
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 optimizedContent:
 *                   type: string
 */
// Generate AI content suggestions for a page
router.post('/:pageId/content-suggestions', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { contentType, currentContent, additionalContext } = req.body;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ 
        message: 'Content generation service not configured. Please add OPENAI_API_KEY to environment variables.' 
      });
      return;
    }

    // Get latest analysis for context
    const analysisArr = await db.select()
      .from(analysisResults)
      .where(eq(analysisResults.pageId, req.params.pageId))
      .orderBy(desc(analysisResults.createdAt))
      .limit(1);

    const analysis = analysisArr[0];
    
    try {
      // Get page summary for better context
      let pageSummary = '';
      try {
        // Prefer structured text from rawLlmOutput if present
        if (analysis?.rawLlmOutput) {
          // Attempt to parse JSON, else use raw text
          try {
            const parsed = JSON.parse(analysis.rawLlmOutput);
            pageSummary = parsed?.summary || analysis.rawLlmOutput;
          } catch {
            pageSummary = analysis.rawLlmOutput;
          }
        }
      } catch {
        pageSummary = '';
      }

      // Create PageContent object using real stored content when possible
      // Prefer the page title; use currentContent only as a fallback for fields being edited
      const pageContentObj = {
        title: page.title || '',
        metaDescription: currentContent && contentType === 'description' ? currentContent : (analysis?.rawLlmOutput || ''),
        url: page.url
      };

             // Generate multiple suggestions using the new functions
       let suggestions;
       try {
         // Create a minimal AnalysisResult object for the function
         const analysisResult = {
           score: analysis?.score || 0,
           summary: analysis?.rawLlmOutput || '',
           issues: [],
           recommendations: [],
           contentQuality: { 
             clarity: 0,
             structure: 0,
             completeness: 0
           },
           technicalSEO: { 
             headingStructure: 0,
             semanticMarkup: 0,
             contentDepth: 0,
             titleOptimization: 0,
             metaDescription: 0,
             schemaMarkup: 0
           },
           keywordAnalysis: { 
             primaryKeywords: [],
             longTailKeywords: [],
             keywordDensity: 0,
             semanticKeywords: [],
             missingKeywords: []
           },
           llmOptimization: {
             definitionsPresent: false,
             faqsPresent: false,
             structuredData: false,
             citationFriendly: false,
             topicCoverage: 0,
             answerableQuestions: 0
           }
         };

         // Generate suggestions based on content type (batched for better diversity)
         if (contentType === 'title') {
           suggestions = await AnalysisService.generateOptimizedTitleList(
             pageContentObj,
             pageSummary,
             pageContentObj.metaDescription || '',
             10
           );
         } else if (contentType === 'description') {
           suggestions = await AnalysisService.generateOptimizedDescriptionList(
             pageContentObj,
             pageSummary,
             4
           );
         } else if (contentType === 'paragraph') {
           suggestions = await AnalysisService.generateSpecificContentType('paragraph', pageContentObj, analysisResult, 1000, pageSummary);
         } else if (contentType === 'faq') {
           suggestions = await AnalysisService.generateSpecificContentType('faq', pageContentObj, analysisResult, 1000, pageSummary);
         } else if (contentType === 'keywords') {
           suggestions = await AnalysisService.generateSpecificContentType('keywords', pageContentObj, analysisResult, 1000, pageSummary);
         } else {
           throw new Error('Unsupported contentType');
         }
       } catch (serviceError: any) {
         console.error(`Failed to generate ${contentType} suggestions:`, serviceError);
         throw new Error(`Content generation failed: ${serviceError.message}`);
       }

          // Replace existing suggestions for this content type (single record per field)
    await db.delete(contentSuggestions)
      .where(and(
        eq(contentSuggestions.pageId, req.params.pageId),
        eq(contentSuggestions.contentType, contentType)
      ));

    // Save new suggestions to database
    await db.insert(contentSuggestions).values({
      pageId: req.params.pageId,
      contentType,
      suggestions,
      requestContext: additionalContext,
      aiModel: process.env.OPENAI_MODEL || 'gpt-4o',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

      res.json({
        contentType,
        suggestions,
        pageUrl: page.url,
        generatedAt: new Date().toISOString()
      });

    } catch (aiError: any) {
      console.error(`❌ Content generation failed for ${page.url}:`, aiError);
      res.status(500).json({ 
        message: 'Content generation failed', 
        error: aiError.message || 'Unknown error occurred during content generation'
      });
    }
  } catch (err) {
    next(err);
  }
});

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
 *                 description: Whether to deploy the content immediately after saving
 *     responses:
 *       200:
 *         description: Content saved and optionally deployed successfully
 */
// Save optimized content for a page
router.post('/:pageId/content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { contentType, originalContent, optimizedContent, generationContext, metadata, deployImmediately = false } = req.body;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    // Deactivate existing content of the same type if deploying immediately
    if (deployImmediately) {
      await db.update(pageContent)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(and(
          eq(pageContent.pageId, req.params.pageId),
          eq(pageContent.contentType, contentType)
        ));
    }

    // Get the next version number
    const existingContent = await db.select()
      .from(pageContent)
      .where(and(
        eq(pageContent.pageId, req.params.pageId),
        eq(pageContent.contentType, contentType)
      ))
      .orderBy(desc(pageContent.version))
      .limit(1);

    const nextVersion = existingContent.length > 0 && existingContent[0] ? (existingContent[0].version || 0) + 1 : 1;

    // Insert new content
    const [savedContent] = await db.insert(pageContent).values({
      pageId: req.params.pageId,
      contentType,
      originalContent,
      optimizedContent,
      aiModel: 'gpt-4o-mini',
      generationContext,
      isActive: deployImmediately ? 1 : 0,
      version: nextVersion,
      metadata: metadata || {},
      pageUrl: page.url,
      deployedAt: deployImmediately ? new Date() : null,
      deployedBy: deployImmediately ? req.user!.userId : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // 🔥 CACHE INVALIDATION: If content was deployed immediately, invalidate cache
    if (deployImmediately) {
      console.log(`🗑️  Invalidating cache for deployed content: ${site.trackerId}:${page.url}`);
      await cache.invalidateTrackerContent(site.trackerId, page.url);
    }

    res.json({
      message: `Content saved${deployImmediately ? ' and deployed' : ''} successfully`,
      content: savedContent,
      deployed: deployImmediately
    });

  } catch (err) {
    next(err);
  }
});

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
 */
// Get optimized content for a page
router.get('/:pageId/content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { contentType } = req.query;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    let content;
    if (contentType) {
      content = await db.select()
        .from(pageContent)
        .where(and(
          eq(pageContent.pageId, req.params.pageId),
          eq(pageContent.contentType, contentType as string)
        ))
        .orderBy(desc(pageContent.createdAt));
    } else {
      content = await db.select()
        .from(pageContent)
        .where(eq(pageContent.pageId, req.params.pageId))
        .orderBy(desc(pageContent.createdAt));
    }

    res.json({
      pageId: req.params.pageId,
      content
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/content-suggestions:
 *   get:
 *     summary: Get cached content suggestions for a page
 *     tags: [Content Generation]
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
 *         description: Content suggestions retrieved
 */
// Get cached content suggestions
router.get('/:pageId/content-suggestions', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { contentType } = req.query;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    let suggestions;
    if (contentType) {
      suggestions = await db.select()
        .from(contentSuggestions)
        .where(and(
          eq(contentSuggestions.pageId, req.params.pageId),
          eq(contentSuggestions.contentType, contentType as string)
        ))
        .orderBy(desc(contentSuggestions.generatedAt))
        .limit(10);
    } else {
      suggestions = await db.select()
        .from(contentSuggestions)
        .where(eq(contentSuggestions.pageId, req.params.pageId))
        .orderBy(desc(contentSuggestions.generatedAt))
        .limit(10);
    }

    res.json({
      pageId: req.params.pageId,
      suggestions
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/content/{contentType}/deploy:
 *   put:
 *     summary: Deploy specific content type for a page
 *     tags: [Page Content]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [title, description, faq, paragraph, keywords, schema]
 *     responses:
 *       200:
 *         description: Content deployed successfully
 */
// Deploy specific content type for a page
router.put('/:pageId/content/:contentType/deploy', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { pageId, contentType } = req.params;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    // Find the latest content for this type
    const contentArr = await db.select()
      .from(pageContent)
      .where(and(
        eq(pageContent.pageId, pageId),
        eq(pageContent.contentType, contentType)
      ))
      .orderBy(desc(pageContent.version))
      .limit(1);

    if (contentArr.length === 0) {
      res.status(404).json({ message: `No ${contentType} content found for this page` });
      return;
    }

    const content = contentArr[0];

    // Deactivate any currently active content of this type
    await db.update(pageContent)
      .set({ 
        isActive: 0, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(pageContent.pageId, pageId),
        eq(pageContent.contentType, contentType),
        eq(pageContent.isActive, 1)
      ));

    // Deploy this specific content
    await db.update(pageContent)
      .set({ 
        isActive: 1,
        deployedAt: new Date(),
        deployedBy: req.user!.userId,
        pageUrl: page.url, // Ensure URL is set for tracker lookup
        updatedAt: new Date()
      })
      .where(eq(pageContent.id, content.id));

    // 🔥 CACHE INVALIDATION: Invalidate cache after deployment
    console.log(`🗑️  Invalidating cache for deployed content: ${site.trackerId}:${page.url} (${contentType})`);
    await cache.invalidateTrackerContent(site.trackerId, page.url);

    res.json({
      message: `${contentType} content deployed successfully`,
      pageId,
      contentType,
      deployedAt: new Date()
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/content/{contentType}/undeploy:
 *   delete:
 *     summary: Undeploy specific content type for a page
 *     tags: [Page Content]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [title, description, faq, paragraph, keywords, schema]
 *     responses:
 *       200:
 *         description: Content undeployed successfully
 */
// Undeploy specific content type for a page
router.delete('/:pageId/content/:contentType/undeploy', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { pageId, contentType } = req.params;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    // Deactivate all content of this type for this page
    const result = await db.update(pageContent)
      .set({ 
        isActive: 0,
        updatedAt: new Date()
      })
      .where(and(
        eq(pageContent.pageId, pageId),
        eq(pageContent.contentType, contentType),
        eq(pageContent.isActive, 1)
      ));

    // 🔥 CACHE INVALIDATION: Invalidate cache after undeployment
    console.log(`🗑️  Invalidating cache for undeployed content: ${site.trackerId}:${page.url} (${contentType})`);
    await cache.invalidateTrackerContent(site.trackerId, page.url);

    res.json({
      message: `${contentType} content undeployed successfully`,
      pageId,
      contentType
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/deployed-content:
 *   get:
 *     summary: Get all deployed content for a page
 *     tags: [Page Content]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deployed content retrieved successfully
 */
// Get all deployed content for a page
router.get('/:pageId/deployed-content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { pageId } = req.params;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    // Get all deployed content for this page
    const deployedContent = await db.select({
      id: pageContent.id,
      contentType: pageContent.contentType,
      optimizedContent: pageContent.optimizedContent,
      version: pageContent.version,
      deployedAt: pageContent.deployedAt,
      deployedBy: pageContent.deployedBy,
      metadata: pageContent.metadata
    })
    .from(pageContent)
    .where(and(
      eq(pageContent.pageId, pageId),
      eq(pageContent.isActive, 1)
    ))
    .orderBy(pageContent.contentType);

    res.json({
      pageId,
      pageUrl: page.url,
      deployedContent
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/original-content:
 *   get:
 *     summary: Get original page content for pre-filling forms
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Original page content and context
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pageId:
 *                   type: string
 *                 pageUrl:
 *                   type: string
 *                 originalContent:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     metaDescription:
 *                       type: string
 *                     headings:
 *                       type: array
 *                       items:
 *                         type: string
 *                 pageSummary:
 *                   type: string
 *                 analysisContext:
 *                   type: object
 *       404:
 *         description: Page not found or not analyzed yet
 */
// Get original page content for pre-filling forms
router.get('/:pageId/original-content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pageArr = await db.select().from(pages).where(eq(pages.id, req.params.pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    let originalContent = null;
    let pageSummary = null;
    let analysisContext = null;

    // Parse content snapshot if available
    if (page.contentSnapshot) {
      try {
        const parsedSnapshot = JSON.parse(page.contentSnapshot);
        originalContent = {
          title: parsedSnapshot.title || page.title || '',
          metaDescription: parsedSnapshot.metaDescription || '',
          headings: parsedSnapshot.headings || [],
          bodyText: parsedSnapshot.bodyText ? parsedSnapshot.bodyText.substring(0, 500) + '...' : '',
          images: parsedSnapshot.images?.length || 0,
          links: parsedSnapshot.links?.length || 0
        };
      } catch (error) {
        console.error('Failed to parse content snapshot:', error);
      }
    }

    // Get latest analysis for page summary and context
    const analysisArr = await db.select()
      .from(analysisResults)
      .where(eq(analysisResults.pageId, req.params.pageId))
      .orderBy(desc(analysisResults.createdAt))
      .limit(1);

    if (analysisArr.length > 0) {
      const analysis = analysisArr[0];
      try {
        const recommendations = typeof analysis.recommendations === 'string' 
          ? JSON.parse(analysis.recommendations) 
          : (analysis.recommendations || {});
        pageSummary = recommendations.pageSummary || null;
        
        analysisContext = {
          score: analysis.score,
          summary: recommendations.summary,
          keywordAnalysis: recommendations.keywordAnalysis,
          issues: recommendations.issues?.slice(0, 3), // First 3 issues
          recommendations: recommendations.recommendations?.slice(0, 5), // First 5 recommendations
          lastAnalyzedAt: analysis.createdAt
        };
      } catch (error) {
        console.error('Failed to parse analysis data:', error);
      }
    }

    // If no original content, try to extract from current page title at minimum
    if (!originalContent) {
      originalContent = {
        title: page.title || '',
        metaDescription: '',
        headings: [],
        bodyText: 'Content not yet analyzed. Run analysis to extract original content.',
        images: 0,
        links: 0
      };
    }

    res.json({
      pageId: req.params.pageId,
      pageUrl: page.url,
      originalContent,
      pageSummary,
      analysisContext,
      needsAnalysis: !page.contentSnapshot
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}:
 *   delete:
 *     summary: Delete a page and all its related data
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
 *                 deletedRelatedData:
 *                   type: object
 *       404:
 *         description: Page not found or not authorized
 */
// Delete a page and all its related data
router.delete('/:pageId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { pageId } = req.params;
    
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    
    // Check site ownership
    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    if (!site || site.userId !== req.user!.userId) {
      res.status(404).json({ message: 'Not authorized' });
      return;
    }

    console.log(`🗑️ Deleting page ${pageId} (${page.url}) and all related data...`);

    // Delete related data in correct order (respecting foreign key constraints)
    const deletedData = {
      analysisResults: 0,
      pageInjectedContent: 0,
      pageContent: 0,
      contentSuggestions: 0,
      pageAnalytics: 0
    };

    // 1. Delete analysis results
    const analysisRes = await db.delete(analysisResults).where(eq(analysisResults.pageId, pageId));
    deletedData.analysisResults = analysisRes.rowCount || 0;

    // 2. Delete page-injected content relationships
    const pageInjectedRes = await db.delete(pageInjectedContent).where(eq(pageInjectedContent.pageId, pageId));
    deletedData.pageInjectedContent = pageInjectedRes.rowCount || 0;

    // 3. Delete page content (optimized content)
    const pageContentRes = await db.delete(pageContent).where(eq(pageContent.pageId, pageId));
    deletedData.pageContent = pageContentRes.rowCount || 0;

    // 4. Delete content suggestions
    const contentSuggestionsRes = await db.delete(contentSuggestions).where(eq(contentSuggestions.pageId, pageId));
    deletedData.contentSuggestions = contentSuggestionsRes.rowCount || 0;

    // 5. Delete page analytics by URL (since it references pageUrl, not pageId)
    const pageAnalyticsRes = await db.delete(pageAnalytics).where(eq(pageAnalytics.pageUrl, page.url));
    deletedData.pageAnalytics = pageAnalyticsRes.rowCount || 0;

    // 6. Finally, delete the page itself
    await db.delete(pages).where(eq(pages.id, pageId));

    console.log(`✅ Successfully deleted page ${pageId} and related data:`, deletedData);

    res.json({
      message: 'Page deleted successfully',
      deletedPageId: pageId,
      deletedRelatedData: deletedData
    });

  } catch (err) {
    console.error(`❌ Failed to delete page ${req.params.pageId}:`, err);
    next(err);
  }
});

export default router; 