import { db } from '../db/client';
import { 
  pageContent, 
  contentSuggestions,
  contentRatings,
  contentRecommendations,
  contentDeployments,
  pages, 
  sites, 
  contentAnalysis 
} from '../db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { AIRecommendationAgent } from '../utils/aiRecommendationAgent';

export interface ContentCreationData {
  pageId: string;
  contentType: string;
  originalContent?: string;
  optimizedContent: string;
  metadata?: any;
  aiModel?: string;
  generationContext?: string;
  pageUrl?: string;
  version?: number;
  isActive?: boolean;
  deployedAt?: Date;
  deployedBy?: string;
}

export interface SectionAnalysisData {
  pageId: string;
  analysisResultId: string;
  sectionType: string;
  currentScore: number;
  issues: string[];
  recommendations: any[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number;
  aiModel?: string;
  analysisContext?: string;
  confidence?: number;
}

export interface DeploymentData {
  pageId: string;
  contentId: string;
  sectionType: string;
  previousScore: number;
  newScore: number;
  scoreImprovement: number;
  deployedContent: string;
  deploymentMethod?: 'manual' | 'api' | 'automated';
  aiModel?: string;
  deployedBy?: string;
  validationResults?: any;
  testResults?: any;
}

export class UnifiedContentService {
  /**
   * Create new content using existing page_content table
   */
  static async createContent(data: ContentCreationData): Promise<string> {
    const [result] = await db.insert(pageContent).values({
      pageId: data.pageId,
      contentType: data.contentType,
      originalContent: data.originalContent,
      optimizedContent: data.optimizedContent,
      aiModel: data.aiModel,
      generationContext: data.generationContext,
      isActive: data.isActive ? 1 : 0,
      version: data.version || 1,
      metadata: data.metadata || {},
      pageUrl: data.pageUrl,
      deployedAt: data.deployedAt,
      deployedBy: data.deployedBy
    }).returning({ id: pageContent.id });
    
    return result.id;
  }

  /**
   * Update existing content
   */
  static async updateContent(contentId: string, data: Partial<ContentCreationData>): Promise<void> {
    await db.update(pageContent)
      .set({
        contentType: data.contentType,
        originalContent: data.originalContent,
        optimizedContent: data.optimizedContent,
        aiModel: data.aiModel,
        generationContext: data.generationContext,
        isActive: data.isActive ? 1 : 0,
        version: data.version,
        metadata: data.metadata,
        pageUrl: data.pageUrl,
        deployedAt: data.deployedAt,
        deployedBy: data.deployedBy,
        updatedAt: new Date()
      })
      .where(eq(pageContent.id, contentId));
  }

  /**
   * Get content by ID
   */
  static async getContentById(contentId: string) {
    const [content] = await db.select()
      .from(pageContent)
      .where(eq(pageContent.id, contentId));
    
    return content;
  }

  /**
   * Get all content for a page
   */
  static async getPageContent(pageId: string) {
    return await db.select()
      .from(pageContent)
      .where(eq(pageContent.pageId, pageId))
      .orderBy(desc(pageContent.createdAt));
  }

  /**
   * Get active content for a page
   */
  static async getActivePageContent(pageId: string) {
    return await db.select()
      .from(pageContent)
      .where(and(
        eq(pageContent.pageId, pageId),
        eq(pageContent.isActive, 1)
      ))
      .orderBy(desc(pageContent.createdAt));
  }

  /**
   * Deploy content and track deployment
   */
  static async deployContent(data: DeploymentData): Promise<string> {
    // Update content as active
    await db.update(pageContent)
      .set({
        isActive: 1,
        deployedAt: new Date(),
        deployedBy: data.deployedBy,
        updatedAt: new Date()
      })
      .where(eq(pageContent.id, data.contentId));

    // Record deployment
    const [deployment] = await db.insert(contentDeployments).values({
      pageId: data.pageId,
      sectionType: data.sectionType,
      previousScore: data.previousScore,
      newScore: data.newScore,
      scoreImprovement: data.scoreImprovement,
      deployedContent: data.deployedContent,
      aiModel: data.aiModel,
      deployedBy: data.deployedBy
    }).returning({ id: contentDeployments.id });

    return deployment.id;
  }

  /**
   * Save section analysis using existing content_ratings table
   */
  static async saveSectionAnalysis(data: SectionAnalysisData): Promise<string> {
    // Save to content_ratings
    const [rating] = await db.insert(contentRatings).values({
      pageId: data.pageId,
      analysisResultId: data.analysisResultId,
      sectionType: data.sectionType,
      currentScore: data.currentScore,
      maxScore: 10,
      previousScore: null, // Will be updated on next analysis
      improvementCount: 0,
      lastImprovedAt: null
    }).returning({ id: contentRatings.id });

    // Also save to content_recommendations for backward compatibility
    for (const recommendation of data.recommendations) {
      await db.insert(contentRecommendations).values({
        pageId: data.pageId,
        analysisResultId: data.analysisResultId,
        sectionType: data.sectionType,
        recommendations: [recommendation],
        priority: recommendation.priority || data.priority,
        estimatedImpact: recommendation.expectedImpact || data.estimatedImpact,
        createdAt: new Date()
      });
    }

    return rating.id;
  }

  /**
   * Get section analysis for a page
   */
  static async getSectionAnalysis(pageId: string) {
    return await db.select()
      .from(contentRatings)
      .where(eq(contentRatings.pageId, pageId))
      .orderBy(desc(contentRatings.createdAt));
  }

  /**
   * Generate AI content using existing content_suggestions table
   */
  static async generateAIContent(
    pageId: string,
    contentType: string,
    context: string,
    count: number = 3
  ): Promise<string[]> {
    try {
      // Generate content using AI agent
      const suggestions = await AIRecommendationAgent.generateContentSuggestions(
        contentType,
        { url: '', title: '', metaDescription: '', headings: [], bodyText: '', images: [], links: [], schemaMarkup: [] },
        { score: 0, contentQuality: {}, technicalSEO: {}, keywordAnalysis: {}, llmOptimization: {}, sectionRatings: {}, sectionRecommendations: {} },
        context,
        count
      );

      // Save to content_suggestions table
      await db.insert(contentSuggestions).values({
        pageId,
        contentType,
        suggestions: Array.isArray(suggestions) ? suggestions : [suggestions],
        requestContext: context,
        aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      });

      return Array.isArray(suggestions) ? suggestions : [suggestions];
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      throw error;
    }
  }

  /**
   * Get content suggestions for a page
   */
  static async getContentSuggestions(pageId: string, contentType?: string) {
    let query = db.select()
      .from(contentSuggestions)
      .where(eq(contentSuggestions.pageId, pageId));

    if (contentType) {
      query = query.where(eq(contentSuggestions.contentType, contentType));
    }

    return await query.orderBy(desc(contentSuggestions.generatedAt));
  }

  /**
   * Get deployment history for a page
   */
  static async getRecentDeployments(pageId: string, limit: number = 10) {
    return await db.select()
      .from(contentDeployments)
      .where(eq(contentDeployments.pageId, pageId))
      .orderBy(desc(contentDeployments.deployedAt))
      .limit(limit);
  }

  /**
   * Get site content statistics
   */
  static async getSiteContentStats(siteId: string) {
    // Get total content count
    const totalContentResult = await db.select({ count: db.$count(pageContent.id) })
      .from(pageContent)
      .leftJoin(pages, eq(pageContent.pageId, pages.id))
      .where(eq(pages.siteId, siteId));
    
    // Get total deployments count
    const totalDeploymentsResult = await db.select({ count: db.$count(contentDeployments.id) })
      .from(contentDeployments)
      .leftJoin(pages, eq(contentDeployments.pageId, pages.id))
      .where(eq(pages.siteId, siteId));
    
    // Get average score improvement (simplified for now)
    
    const stats = {
      totalContent: totalContentResult[0]?.count || 0,
      activeContent: totalContentResult[0]?.count || 0, // Same as total for now
      totalDeployments: totalDeploymentsResult[0]?.count || 0,
      avgScoreImprovement: 0 // Simplified for now
    };

    return stats;
  }

  /**
   * Archive content (set as inactive)
   */
  static async archiveContent(contentId: string): Promise<void> {
    await db.update(pageContent)
      .set({
        isActive: 0,
        updatedAt: new Date()
      })
      .where(eq(pageContent.id, contentId));
  }
}