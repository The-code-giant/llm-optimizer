import { Router, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, contentAnalysis, pageContent, contentSuggestions, pageAnalytics, contentRatings, contentRecommendations, contentDeployments } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';
import { AnalysisService } from '../utils/analysisService';
import { EnhancedRatingService } from '../utils/enhancedRatingService';
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
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, req.params.pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(1);
    
    if (analysisArr.length === 0) {
      res.status(404).json({ message: 'No analysis found for this page' });
      return;
    }
    
    const analysis = analysisArr[0];
    
    // Map database result to frontend interface
    let recommendations: string[] = [];
    let issues: string[] = [];
    
    // Get recommendations from content_recommendations table
    const contentRecs = await db.select()
      .from(contentRecommendations)
      .where(eq(contentRecommendations.analysisResultId, analysis.id));
    
    // Extract recommendations from the normalized structure
    for (const rec of contentRecs) {
      if (Array.isArray(rec.recommendations)) {
        recommendations.push(...rec.recommendations);
      }
    }
    
    // Get section ratings and recommendations
    let sectionRatings = null;
    let sectionRecommendationsData: any = {};
    
    try {
      sectionRatings = await EnhancedRatingService.getCurrentSectionRatings(req.params.pageId);
      
      if (sectionRatings) {
        const sectionTypes = ['title', 'description', 'headings', 'content', 'schema', 'images', 'links'];
        
        for (const sectionType of sectionTypes) {
          sectionRecommendationsData[sectionType] = await EnhancedRatingService.getSectionRecommendations(
            req.params.pageId, 
            sectionType
          );
        }
      }
    } catch (error) {
      console.error('Failed to get section ratings:', error);
    }

    // Create a structured summary object that matches frontend expectations
    const structuredSummary = {
      summary: analysis.analysisSummary || 'No summary available',
      score: analysis.overallScore || 0,
      contentQuality: {
        clarity: analysis.contentClarity || 0,
        structure: analysis.contentStructure || 0,
        completeness: analysis.contentCompleteness || 0,
      },
      technicalSEO: {
        titleOptimization: analysis.titleOptimization || 0,
        metaDescription: analysis.metaDescription || 0,
        headingStructure: analysis.headingStructure || 0,
        schemaMarkup: analysis.schemaMarkup || 0,
      },
      keywordAnalysis: {
        primaryKeywords: analysis.primaryKeywords || [],
        longTailKeywords: analysis.longTailKeywords || [],
        semanticKeywords: analysis.semanticKeywords || [],
        keywordDensity: analysis.keywordDensity || 0,
      },
      llmOptimization: {
        definitionsPresent: analysis.definitionsPresent || 0,
        faqsPresent: analysis.faqsPresent || 0,
        structuredData: analysis.structuredData || 0,
        citationFriendly: analysis.citationFriendly || 0,
        topicCoverage: analysis.topicCoverage || 0,
        answerableQuestions: analysis.answerableQuestions || 0,
      },
      recommendations: sectionRecommendationsData || {},
    };

    const result = {
      id: analysis.id,
      pageId: analysis.pageId,
      summary: JSON.stringify(structuredSummary),
      issues: issues,
      recommendations: recommendations,
      score: analysis.overallScore || 0,
      sectionRatings,
      sectionRecommendations: sectionRecommendationsData,
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
      }) as any; // Type assertion to avoid TypeScript issues

      // Calculate section-based score if section ratings are available
      let finalScore = analysisResult.score; // Default to AI analysis score
      if (analysisResult.sectionRatings) {
        const sectionBasedScore = EnhancedRatingService.calculateTotalScore(analysisResult.sectionRatings);
        console.log(`📊 Section-based score: ${sectionBasedScore}% (from 7 sections), AI analysis score: ${analysisResult.score}%`);
        finalScore = sectionBasedScore; // Use section-based score as primary
      }

      // Always update the content snapshot after analysis (especially if it was refreshed)
      await db.update(pages)
        .set({ 
          contentSnapshot: JSON.stringify(analysisResult.content),
          title: analysisResult.content.title || page.title,
          llmReadinessScore: finalScore,
          lastAnalysisAt: new Date(),
          lastScannedAt: new Date()
        })
        .where(eq(pages.id, page.id));

      // Store analysis results in database (normalized structure)
      const newAnalysis = await db.insert(contentAnalysis).values({
        pageId: page.id,
        overallScore: finalScore,
        llmModelUsed: 'gpt-4o-mini',
        pageSummary: (analysisResult as any).pageSummary,
        analysisSummary: (analysisResult as any).summary,
        
        // Content quality metrics
        contentClarity: analysisResult.contentQuality?.clarity || 0,
        contentStructure: analysisResult.contentQuality?.structure || 0,
        contentCompleteness: analysisResult.contentQuality?.completeness || 0,
        
        // Technical SEO metrics
        titleOptimization: analysisResult.technicalSEO?.titleOptimization || 0,
        metaDescription: analysisResult.technicalSEO?.metaDescription || 0,
        headingStructure: analysisResult.technicalSEO?.headingStructure || 0,
        schemaMarkup: analysisResult.technicalSEO?.schemaMarkup || 0,
        
        // Keyword analysis
        primaryKeywords: analysisResult.keywordAnalysis?.primaryKeywords || [],
        longTailKeywords: analysisResult.keywordAnalysis?.longTailKeywords || [],
        keywordDensity: analysisResult.keywordAnalysis?.keywordDensity || 0,
        semanticKeywords: analysisResult.keywordAnalysis?.semanticKeywords || [],
        
        // LLM optimization metrics
        definitionsPresent: analysisResult.llmOptimization?.definitionsPresent ? 1 : 0,
        faqsPresent: analysisResult.llmOptimization?.faqsPresent ? 1 : 0,
        structuredData: analysisResult.llmOptimization?.structuredData ? 1 : 0,
        citationFriendly: analysisResult.llmOptimization?.citationFriendly ? 1 : 0,
        topicCoverage: analysisResult.llmOptimization?.topicCoverage || 0,
        answerableQuestions: analysisResult.llmOptimization?.answerableQuestions || 0,
        
        confidence: 0.8,
        analysisVersion: '2.0'
      }).returning();

      // Clear existing section ratings and recommendations for this page
      console.log(`🗑️ Clearing existing section ratings and recommendations for page: ${page.id}`);
      
      // Delete existing content ratings for this page
      await db.delete(contentRatings)
        .where(eq(contentRatings.pageId, page.id));
      
      // Delete existing content recommendations for this page
      await db.delete(contentRecommendations)
        .where(eq(contentRecommendations.pageId, page.id));

      // Generate AI-powered recommendations instead of static ones
      console.log('🤖 Generating AI-powered recommendations...');
      let aiRecommendations;
      try {
                 aiRecommendations = await AnalysisService.generateAIRecommendations(
           analysisResult.content,
           analysisResult as any,
           analysisResult.pageSummary || ''
         );
        console.log('✅ AI recommendations generated successfully');
      } catch (aiError) {
        console.error('❌ AI recommendation generation failed, falling back to basic recommendations:', aiError);
        // Fallback to basic recommendations if AI fails
        aiRecommendations = {
          sections: [
            {
              sectionType: 'title',
              currentScore: Math.round(analysisResult.technicalSEO.titleOptimization / 10),
              recommendations: analysisResult.technicalSEO.titleOptimization < 70 ? [{
                priority: 'high',
                category: 'SEO',
                title: 'Optimize page title',
                description: 'Improve title for better SEO and click-through rates',
                expectedImpact: 2,
                implementation: 'Include primary keywords and keep length 50-60 characters'
              }] : [],
              overallAssessment: 'Title needs optimization',
              estimatedImprovement: 2
            },
            {
              sectionType: 'description',
              currentScore: Math.round(analysisResult.technicalSEO.metaDescription / 10),
              recommendations: analysisResult.technicalSEO.metaDescription < 70 ? [{
                priority: 'high',
                category: 'SEO',
                title: 'Optimize meta description',
                description: 'Improve meta description for better click-through rates',
                expectedImpact: 2,
                implementation: 'Include primary keywords and keep length 150-160 characters'
              }] : [],
              overallAssessment: 'Meta description needs optimization',
              estimatedImprovement: 2
            },
            {
              sectionType: 'headings',
              currentScore: Math.round(analysisResult.technicalSEO.headingStructure / 10),
              recommendations: analysisResult.technicalSEO.headingStructure < 70 ? [{
                priority: 'medium',
                category: 'SEO',
                title: 'Improve heading structure',
                description: 'Enhance heading hierarchy for better content organization',
                expectedImpact: 1.5,
                implementation: 'Use proper H1-H6 hierarchy with descriptive headings'
              }] : [],
              overallAssessment: 'Heading structure needs improvement',
              estimatedImprovement: 1.5
            },
            {
              sectionType: 'content',
              currentScore: Math.round(analysisResult.contentQuality.completeness / 10),
              recommendations: analysisResult.contentQuality.completeness < 70 ? [{
                priority: 'medium',
                category: 'Content',
                title: 'Enhance content quality',
                description: 'Improve content comprehensiveness and structure',
                expectedImpact: 2,
                implementation: 'Add more detailed information, examples, and structured content'
              }] : [],
              overallAssessment: 'Content quality needs improvement',
              estimatedImprovement: 2
            },
            {
              sectionType: 'schema',
              currentScore: Math.round(analysisResult.technicalSEO.schemaMarkup / 10),
              recommendations: analysisResult.technicalSEO.schemaMarkup < 70 ? [{
                priority: 'medium',
                category: 'Technical',
                title: 'Implement structured data',
                description: 'Add schema markup for better search engine understanding',
                expectedImpact: 1.5,
                implementation: 'Add JSON-LD structured data markup'
              }] : [],
              overallAssessment: 'Schema markup needs implementation',
              estimatedImprovement: 1.5
            },
            {
              sectionType: 'images',
              currentScore: Math.round(analysisResult.contentQuality.structure / 10),
              recommendations: analysisResult.contentQuality.structure < 70 ? [{
                priority: 'low',
                category: 'UX',
                title: 'Optimize images',
                description: 'Improve image optimization and accessibility',
                expectedImpact: 1,
                implementation: 'Add alt text and optimize image file sizes'
              }] : [],
              overallAssessment: 'Image optimization needed',
              estimatedImprovement: 1
            },
            {
              sectionType: 'links',
              currentScore: Math.round(analysisResult.contentQuality.structure / 10),
              recommendations: analysisResult.contentQuality.structure < 70 ? [{
                priority: 'low',
                category: 'SEO',
                title: 'Improve internal linking',
                description: 'Enhance internal link structure',
                expectedImpact: 1,
                implementation: 'Add relevant internal links with descriptive anchor text'
              }] : [],
              overallAssessment: 'Internal linking needs improvement',
              estimatedImprovement: 1
            }
          ]
        };
      }

      // Convert AI recommendations to the format expected by EnhancedRatingService
      const contentRecommendationsData = {
        title: aiRecommendations.sections.find(s => s.sectionType === 'title')?.recommendations.map(r => r.title) || [],
        description: aiRecommendations.sections.find(s => s.sectionType === 'description')?.recommendations.map(r => r.title) || [],
        headings: aiRecommendations.sections.find(s => s.sectionType === 'headings')?.recommendations.map(r => r.title) || [],
        content: aiRecommendations.sections.find(s => s.sectionType === 'content')?.recommendations.map(r => r.title) || [],
        schema: aiRecommendations.sections.find(s => s.sectionType === 'schema')?.recommendations.map(r => r.title) || [],
        images: aiRecommendations.sections.find(s => s.sectionType === 'images')?.recommendations.map(r => r.title) || [],
        links: aiRecommendations.sections.find(s => s.sectionType === 'links')?.recommendations.map(r => r.title) || []
      };

      // Generate section ratings from AI recommendations
      const sectionRatings = {
        title: aiRecommendations.sections.find(s => s.sectionType === 'title')?.currentScore || Math.round(analysisResult.technicalSEO.titleOptimization / 10),
        description: aiRecommendations.sections.find(s => s.sectionType === 'description')?.currentScore || Math.round(analysisResult.technicalSEO.metaDescription / 10),
        headings: aiRecommendations.sections.find(s => s.sectionType === 'headings')?.currentScore || Math.round(analysisResult.technicalSEO.headingStructure / 10),
        content: aiRecommendations.sections.find(s => s.sectionType === 'content')?.currentScore || Math.round(analysisResult.contentQuality.completeness / 10),
        schema: aiRecommendations.sections.find(s => s.sectionType === 'schema')?.currentScore || Math.round(analysisResult.technicalSEO.schemaMarkup / 10),
        images: aiRecommendations.sections.find(s => s.sectionType === 'images')?.currentScore || Math.round(analysisResult.contentQuality.structure / 10),
        links: aiRecommendations.sections.find(s => s.sectionType === 'links')?.currentScore || Math.round(analysisResult.contentQuality.structure / 10)
      };

      // Save fresh section ratings and recommendations
      await EnhancedRatingService.saveSectionRatings(
        page.id,
        newAnalysis[0].id,
        sectionRatings
      );

      await EnhancedRatingService.saveSectionRecommendations(
        page.id,
        newAnalysis[0].id,
        contentRecommendationsData
      );

      console.log(`✅ Analysis completed for ${page.url} - Score: ${finalScore}/100`);

      // Return the analysis results immediately
      res.json({
        message: 'Analysis completed successfully',
        analysis: {
          id: newAnalysis[0].id,
          pageId: page.id,
                  summary: (analysisResult as any).summary,
        issues: (analysisResult as any).issues,
        recommendations: (analysisResult as any).recommendations,
          score: finalScore,
          sectionRatings,
          contentRecommendations: contentRecommendationsData,
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
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, req.params.pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(1);

    const analysis = analysisArr[0];
    
    try {
      // Get page summary for better context
      let pageSummary = '';
      try {
        // Use page summary from normalized structure
        if (analysis?.pageSummary) {
          pageSummary = analysis.pageSummary;
        } else if (analysis?.analysisSummary) {
          pageSummary = analysis.analysisSummary;
        }
      } catch {
        pageSummary = '';
      }

      // Create PageContent object using real stored content when possible
      // Prefer the page title; use currentContent only as a fallback for fields being edited
      const pageContentObj = {
        title: page.title || '',
        metaDescription: currentContent && contentType === 'description' ? currentContent : (analysis?.analysisSummary || ''),
        url: page.url
      };

             // Generate multiple suggestions using the new functions
       let suggestions;
       try {
         // Create a minimal AnalysisResult object for the function
         const analysisResult = {
           score: analysis?.overallScore || 0,
           summary: analysis?.analysisSummary || '',
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
           },
           sectionRatings: {
             title: 0,
             description: 0,
             headings: 0,
             content: 0,
             schema: 0,
             images: 0,
             links: 0
           },
           contentRecommendations: {
             title: [],
             description: [],
             headings: [],
             content: [],
             schema: [],
             images: [],
             links: []
           }
         };

         // Generate suggestions based on content type (batched for better diversity)
         if (contentType === 'title') {
           suggestions = await AnalysisService.generateOptimizedTitleList(
             pageContentObj,
             pageSummary,
             pageContentObj.metaDescription || '',
             3
           );
         } else if (contentType === 'description') {
           suggestions = await AnalysisService.generateOptimizedDescriptionList(
             pageContentObj,
             pageSummary,
             3
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

    // 📊 UPDATE PAGE SCORE: Add improvement points based on content type deployed
    const scoreImprovements: Record<string, number> = {
      'title': 5,        // Title optimization typically improves score by 5 points
      'description': 4,  // Meta description improvement
      'faq': 8,          // FAQ sections have high impact on LLM readiness
      'paragraph': 6,    // Content improvements
      'keywords': 3,     // Keyword optimization
      'schema': 4        // Schema markup improvement
    };

    const improvement = scoreImprovements[contentType] || 3; // Default 3 points for unknown types
    const currentScore = page.llmReadinessScore || 0;
    const newScore = Math.min(100, currentScore + improvement); // Cap at 100

    await db.update(pages)
      .set({
        llmReadinessScore: newScore,
        lastAnalysisAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(pages.id, pageId));

    console.log(`✅ Updated LLM readiness score: ${currentScore} → ${newScore} (+${improvement} for ${contentType})`);

    res.json({
      message: `${contentType} content deployed successfully`,
      pageId,
      contentType,
      deployedAt: new Date(),
      scoreImprovement: improvement,
      newScore: newScore
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
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, req.params.pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(1);

    if (analysisArr.length > 0) {
      const analysis = analysisArr[0];
      try {
                const recommendations = {}; // No longer stored in analysis table
        pageSummary = recommendations.pageSummary || null;
        
        analysisContext = {
          score: analysis.overallScore,
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
      contentRatings: 0,
      contentRecommendations: 0,
      contentDeployments: 0,
      contentAnalysis: 0,
      pageInjectedContent: 0,
      pageContent: 0,
      contentSuggestions: 0,
      pageAnalytics: 0
    };

    // 1. Delete content ratings (references both pages and analysis_results)
    const contentRatingsRes = await db.delete(contentRatings).where(eq(contentRatings.pageId, pageId));
    deletedData.contentRatings = contentRatingsRes.rowCount || 0;

    // 2. Delete content recommendations (references pages)
    const contentRecommendationsRes = await db.delete(contentRecommendations).where(eq(contentRecommendations.pageId, pageId));
    deletedData.contentRecommendations = contentRecommendationsRes.rowCount || 0;

    // 3. Delete content deployments (references pages)
    const contentDeploymentsRes = await db.delete(contentDeployments).where(eq(contentDeployments.pageId, pageId));
    deletedData.contentDeployments = contentDeploymentsRes.rowCount || 0;

    // 4. Delete content analysis (now safe to delete since content_ratings are gone)
    const analysisRes = await db.delete(contentAnalysis).where(eq(contentAnalysis.pageId, pageId));
    deletedData.contentAnalysis = analysisRes.rowCount || 0;

    // 5. Delete page-injected content relationships
    const pageInjectedRes = await db.delete(pageInjectedContent).where(eq(pageInjectedContent.pageId, pageId));
    deletedData.pageInjectedContent = pageInjectedRes.rowCount || 0;

    // 6. Delete page content (optimized content)
    const pageContentRes = await db.delete(pageContent).where(eq(pageContent.pageId, pageId));
    deletedData.pageContent = pageContentRes.rowCount || 0;

    // 7. Delete content suggestions
    const contentSuggestionsRes = await db.delete(contentSuggestions).where(eq(contentSuggestions.pageId, pageId));
    deletedData.contentSuggestions = contentSuggestionsRes.rowCount || 0;

    // 8. Delete page analytics by URL (since it references pageUrl, not pageId)
    const pageAnalyticsRes = await db.delete(pageAnalytics).where(eq(pageAnalytics.pageUrl, page.url));
    deletedData.pageAnalytics = pageAnalyticsRes.rowCount || 0;

    // 9. Finally, delete the page itself
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

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-ratings:
 *   get:
 *     summary: Get section ratings for a page
 *     tags: [Section Ratings]
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
 *                 contentRecommendations:
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
 *       404:
 *         description: Page not found or no ratings available
 */
// Get section ratings for a page
router.get('/:pageId/section-ratings', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    // Get current section ratings
    const sectionRatings = await EnhancedRatingService.getCurrentSectionRatings(req.params.pageId);
    
    if (!sectionRatings) {
      res.status(404).json({ message: 'No section ratings found for this page' });
      return;
    }

    // Get content recommendations
    const sectionRecommendationsData: any = {};
    const sectionTypes = ['title', 'description', 'headings', 'content', 'schema', 'images', 'links'];
    
    for (const sectionType of sectionTypes) {
      sectionRecommendationsData[sectionType] = await EnhancedRatingService.getSectionRecommendations(
        req.params.pageId, 
        sectionType
      );
    }

    res.json({
      pageId: req.params.pageId,
      sectionRatings,
      sectionRecommendations: sectionRecommendationsData
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-ratings:
 *   post:
 *     summary: Update section ratings for a page
 *     tags: [Section Ratings]
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
 *       404:
 *         description: Page not found or not authorized
 */
// Update section ratings for a page
router.post('/:pageId/section-ratings', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sectionType, newScore, deployedContent, aiModel } = req.body;
    
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

    // Get current section rating
    const currentRatings = await EnhancedRatingService.getCurrentSectionRatings(req.params.pageId);
    if (!currentRatings) {
      res.status(404).json({ message: 'No section ratings found for this page' });
      return;
    }

    const previousScore = currentRatings[sectionType as keyof typeof currentRatings] || 0;

    // Record the content deployment and update section score
    await EnhancedRatingService.recordContentDeployment(
      req.params.pageId,
      sectionType,
      previousScore,
      newScore,
      deployedContent || '',
      aiModel || 'gpt-4o-mini',
      req.user!.userId
    );

    res.json({
      message: `${sectionType} section rating updated successfully`,
      sectionType,
      previousScore,
      newScore,
      scoreImprovement: newScore - previousScore
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-improvements:
 *   get:
 *     summary: Get improvement history for a section
 *     tags: [Section Ratings]
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
 *           enum: [title, description, headings, content, schema, images, links]
 *     responses:
 *       200:
 *         description: Section improvement history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pageId:
 *                   type: string
 *                 sectionType:
 *                   type: string
 *                 improvements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       previousScore:
 *                         type: number
 *                       newScore:
 *                         type: number
 *                       scoreImprovement:
 *                         type: number
 *                       deployedContent:
 *                         type: string
 *                       deployedAt:
 *                         type: string
 *       404:
 *         description: Page not found or not authorized
 */
// Get improvement history for a section
router.get('/:pageId/section-improvements', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sectionType } = req.query;
    
    if (!sectionType || typeof sectionType !== 'string') {
      res.status(400).json({ message: 'sectionType query parameter is required' });
      return;
    }

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

    // Get improvement history for the section
    const improvements = await EnhancedRatingService.getSectionImprovementHistory(
      req.params.pageId, 
      sectionType
    );

    res.json({
      pageId: req.params.pageId,
      sectionType,
      improvements
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/pages/{pageId}/section-content:
 *   post:
 *     summary: Generate optimized content for selected section recommendations
 *     tags: [Section Content Generation]
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
 *               sectionType:
 *                 type: string
 *                 enum: [title, description, headings, content, schema, images, links]
 *               selectedRecommendations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of selected recommendations to address
 *               currentContent:
 *                 type: string
 *                 description: Current content for the section
 *               additionalContext:
 *                 type: string
 *                 description: Additional context for content generation
 *     responses:
 *       200:
 *         description: Generated content based on selected recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sectionType:
 *                   type: string
 *                 generatedContent:
 *                   type: string
 *                 keyPoints:
 *                   type: array
 *                   items:
 *                     type: string
 *                 recommendationsAddressed:
 *                   type: array
 *                   items:
 *                     type: string
 *                 estimatedScoreImprovement:
 *                   type: number
 *                 generationContext:
 *                   type: string
 *       404:
 *         description: Page not found or not authorized
 *       500:
 *         description: Content generation failed
 */
// Generate optimized content for selected section recommendations
router.post('/:pageId/section-content', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sectionType, selectedRecommendations, currentContent, additionalContext } = req.body;
    
    if (!sectionType || !selectedRecommendations || !Array.isArray(selectedRecommendations)) {
      res.status(400).json({ 
        message: 'sectionType and selectedRecommendations array are required' 
      });
      return;
    }
    
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
      .from(contentAnalysis)
      .where(eq(contentAnalysis.pageId, req.params.pageId))
      .orderBy(desc(contentAnalysis.createdAt))
      .limit(1);

    const analysis = analysisArr[0];
    if (!analysis) {
      res.status(404).json({ message: 'No analysis found for this page' });
      return;
    }

    try {
      // Parse analysis result to get page content and context
      const analysisData = {}; // No longer stored in analysis table
      const pageContent = {
        summary: analysis.analysisSummary || '',
        pageSummary: analysis.pageSummary || ''
      };
      
      // Generate content based on selected recommendations
      const generatedContent = await AnalysisService.generateSectionContent(
        sectionType,
        selectedRecommendations,
        pageContent,
        analysisData,
        currentContent || '',
        additionalContext || ''
      );

      // Calculate estimated score improvement
      const estimatedImprovement = AnalysisService.estimateScoreImprovement(
        sectionType,
        selectedRecommendations,
        analysisData
      );

      res.json({
        sectionType,
        generatedContent: generatedContent.content,
        keyPoints: generatedContent.keyPoints,
        recommendationsAddressed: selectedRecommendations,
        estimatedScoreImprovement: estimatedImprovement,
        generationContext: `Generated based on ${selectedRecommendations.length} selected recommendations for ${sectionType} optimization`,
        pageUrl: page.url,
        generatedAt: new Date().toISOString()
      });

    } catch (aiError: any) {
      console.error(`❌ Section content generation failed for ${page.url}:`, aiError);
      res.status(500).json({ 
        message: 'Content generation failed', 
        error: aiError.message || 'Unknown error occurred during content generation'
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router; 