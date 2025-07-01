import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, analysisResults, pageContent, contentSuggestions } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';
import { AnalysisService } from '../utils/analysisService';
import OpenAI from 'openai';

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
      // Perform the actual analysis
      const analysisResult = await AnalysisService.analyzePage({
        url: page.url,
        contentSnapshot: page.contentSnapshot || undefined
      });

      // Store analysis results in database
      const newAnalysis = await db.insert(analysisResults).values({
        pageId: page.id,
        analyzedAt: new Date(),
        llmModelUsed: 'gpt-4o-mini',
        score: analysisResult.score,
        recommendations: {
          issues: analysisResult.issues,
          recommendations: analysisResult.recommendations,
          contentQuality: analysisResult.contentQuality,
          technicalSEO: analysisResult.technicalSEO,
          llmOptimization: analysisResult.llmOptimization
        },
        rawLlmOutput: analysisResult.summary,
      }).returning();

      // Update page's LLM readiness score and last analysis timestamp
      await db.update(pages)
        .set({ 
          llmReadinessScore: analysisResult.score,
          lastAnalysisAt: new Date()
        })
        .where(eq(pages.id, page.id));

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
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      let prompt = '';
      let maxTokens = 300;

      switch (contentType) {
        case 'title':
          prompt = `
Generate 5 SEO-optimized page titles for this webpage:

URL: ${page.url}
Current Title: ${currentContent || page.title || 'No title'}
Page Analysis: ${analysis?.rawLlmOutput || 'No analysis available'}
Additional Context: ${additionalContext || ''}

Requirements:
- 50-60 characters optimal length
- Include primary keywords naturally
- Make it compelling and click-worthy
- Focus on user intent and value proposition
- Consider long-tail keyword opportunities

Return ONLY a JSON array of 5 title suggestions:
["title 1", "title 2", "title 3", "title 4", "title 5"]`;
          break;

        case 'description':
          prompt = `
Generate 3 SEO-optimized meta descriptions for this webpage:

URL: ${page.url}
Title: ${page.title || 'No title'}
Current Description: ${currentContent || 'No description'}
Page Analysis: ${analysis?.rawLlmOutput || 'No analysis available'}
Additional Context: ${additionalContext || ''}

Requirements:
- 150-160 characters optimal length
- Include primary keywords naturally
- Compelling call-to-action
- Describe the page value clearly
- Match search intent

Return ONLY a JSON array of 3 descriptions:
["description 1", "description 2", "description 3"]`;
          break;

        case 'faq':
          maxTokens = 800;
          prompt = `
Generate a comprehensive FAQ section for this webpage based on the analysis:

URL: ${page.url}
Title: ${page.title || 'No title'}
Page Analysis: ${analysis?.rawLlmOutput || 'No analysis available'}
Current FAQ Content: ${currentContent || 'No existing FAQ'}
Additional Context: ${additionalContext || ''}

Generate 5-8 relevant questions and detailed answers that:
- Address common user queries about this topic
- Include naturally integrated keywords
- Provide comprehensive, helpful answers
- Are structured for LLM understanding
- Focus on user intent and value

Return ONLY a JSON object:
{
  "faqs": [
    {
      "question": "Question 1?",
      "answer": "Detailed answer..."
    },
    {
      "question": "Question 2?", 
      "answer": "Detailed answer..."
    }
  ]
}`;
          break;

        case 'paragraph':
          maxTokens = 500;
          prompt = `
Generate 3 optimized content paragraphs for this webpage:

URL: ${page.url}
Title: ${page.title || 'No title'}
Page Analysis: ${analysis?.rawLlmOutput || 'No analysis available'}
Current Content Context: ${currentContent || 'No existing content'}
Additional Context: ${additionalContext || ''}

Generate paragraphs that:
- Are 100-150 words each
- Include relevant keywords naturally
- Provide valuable, actionable information
- Are structured for LLM understanding
- Address user search intent

Return ONLY a JSON array of 3 paragraphs:
["paragraph 1 content...", "paragraph 2 content...", "paragraph 3 content..."]`;
          break;

        case 'keywords':
          prompt = `
Generate keyword optimization suggestions for this webpage:

URL: ${page.url}
Title: ${page.title || 'No title'}
Page Analysis: ${analysis?.rawLlmOutput || 'No analysis available'}
Current Keywords Focus: ${currentContent || 'No current focus'}
Additional Context: ${additionalContext || ''}

Generate:
- 5-7 primary keywords
- 8-10 long-tail keyword phrases (4+ words)
- 5-7 semantic/LSI keywords
- 3-5 missing keyword opportunities

Return ONLY a JSON object:
{
  "primary": ["keyword1", "keyword2"],
  "longTail": ["long tail phrase 1", "specific query phrase 2"],
  "semantic": ["related term 1", "synonym 2"],
  "missing": ["opportunity 1", "gap 2"]
}`;
          break;

        default:
          res.status(400).json({ message: 'Invalid content type' });
          return;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist and SEO specialist. Generate high-quality, optimized content that helps pages rank better and get cited by LLMs. Always return valid JSON as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      let suggestions;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        suggestions = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('Failed to parse content suggestions');
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
      aiModel: 'gpt-4o-mini',
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
 *                 enum: [title, description, faq, paragraph, keywords]
 *               originalContent:
 *                 type: string
 *               optimizedContent:
 *                 type: string
 *               generationContext:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content saved successfully
 */
// Save optimized content for a page
router.post('/:pageId/content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { contentType, originalContent, optimizedContent, generationContext, metadata } = req.body;
    
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

    // Deactivate existing content of the same type
    await db.update(pageContent)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(and(
        eq(pageContent.pageId, req.params.pageId),
        eq(pageContent.contentType, contentType)
      ));

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
      isActive: 1,
      version: nextVersion,
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.json({
      message: 'Content saved successfully',
      content: savedContent
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
          eq(pageContent.contentType, contentType as string),
          eq(pageContent.isActive, 1)
        ))
        .orderBy(desc(pageContent.createdAt));
    } else {
      content = await db.select()
        .from(pageContent)
        .where(and(
          eq(pageContent.pageId, req.params.pageId),
          eq(pageContent.isActive, 1)
        ))
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

export default router; 