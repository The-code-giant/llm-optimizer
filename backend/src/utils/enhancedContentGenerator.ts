import { ragService } from './ragService';
import { knowledgeBaseManager } from './knowledgeBaseManager';
import { db } from '../db/client';
import { pageContent, sites } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface EnhancedContentRequest {
  siteId: string;
  pageId: string;
  contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords';
  topic: string;
  additionalContext?: string;
  useRAG?: boolean;
  ragThreshold?: number;
}

export interface EnhancedContentResponse {
  content: string;
  ragEnhanced: boolean;
  contextSources: string[];
  ragScore: number;
  performanceMetrics: {
    responseTime: number;
    contextRetrievalTime: number;
    generationTime: number;
  };
  suggestions: string[];
}

export class EnhancedContentGenerator {
  /**
   * Generate enhanced content using RAG when available
   */
  async generateEnhancedContent(request: EnhancedContentRequest): Promise<EnhancedContentResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Generating enhanced ${request.contentType} for site ${request.siteId}`);

      // Check if RAG is enabled for the site
      const [site] = await db.select({ ragEnabled: sites.ragEnabled })
        .from(sites)
        .where(eq(sites.id, request.siteId));

      if (!site?.ragEnabled) {
        console.log(`RAG not enabled for site ${request.siteId}, using standard generation`);
        return this.generateStandardContent(request);
      }

      // Check knowledge base status
      const kbStatus = await knowledgeBaseManager.getKnowledgeBaseStatus(request.siteId);
      
      if (!kbStatus || kbStatus.status !== 'ready') {
        console.log(`Knowledge base not ready for site ${request.siteId}, using standard generation`);
        return this.generateStandardContent(request);
      }

      // Use RAG for enhanced content generation
      return await this.generateRAGContent(request);
    } catch (error) {
      console.error('Error generating enhanced content:', error);
      
      // Fallback to standard generation
      return this.generateStandardContent(request);
    }
  }

  /**
   * Generate content using RAG
   */
  private async generateRAGContent(request: EnhancedContentRequest): Promise<EnhancedContentResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Generating RAG-enhanced ${request.contentType} for site ${request.siteId}`);

      // Generate content using RAG
      const ragResponse = await ragService.generateContent(
        request.siteId,
        request.contentType,
        request.topic,
        request.additionalContext
      );

      // Analyze content quality
      const qualityAnalysis = await ragService.analyzeContentQuality(
        request.siteId,
        ragResponse.response,
        request.topic
      );

      // Extract context sources
      const contextSources = ragResponse.contextUsed.map(doc => doc.metadata.url || '').filter(Boolean);

      // Calculate RAG score based on similarity scores
      const ragScore = ragResponse.performanceMetrics.similarityScores.length > 0
        ? ragResponse.performanceMetrics.similarityScores.reduce((a, b) => a + b, 0) / ragResponse.performanceMetrics.similarityScores.length
        : 0;

      const responseTime = Date.now() - startTime;

      return {
        content: ragResponse.response,
        ragEnhanced: true,
        contextSources,
        ragScore,
        performanceMetrics: {
          responseTime,
          contextRetrievalTime: ragResponse.performanceMetrics.contextRetrievalTime,
          generationTime: ragResponse.performanceMetrics.generationTime,
        },
        suggestions: qualityAnalysis.suggestions,
      };
    } catch (error) {
      console.error('Error generating RAG content:', error);
      throw error;
    }
  }

  /**
   * Generate standard content (fallback)
   */
  private generateStandardContent(request: EnhancedContentRequest): EnhancedContentResponse {
    console.log(`Generating standard ${request.contentType} for site ${request.siteId}`);

    // This would integrate with your existing content generation logic
    // For now, returning a placeholder
    const content = this.generatePlaceholderContent(request.contentType, request.topic);

    return {
      content,
      ragEnhanced: false,
      contextSources: [],
      ragScore: 0,
      performanceMetrics: {
        responseTime: 0,
        contextRetrievalTime: 0,
        generationTime: 0,
      },
      suggestions: [
        'Enable RAG for enhanced, site-specific content generation',
        'Add more context to improve content relevance',
      ],
    };
  }

  /**
   * Generate placeholder content for testing
   */
  private generatePlaceholderContent(contentType: string, topic: string): string {
    const placeholders = {
      title: `Optimized ${topic} - Professional Solutions`,
      description: `Discover expert ${topic} solutions tailored to your needs. Get professional guidance and actionable insights.`,
      faq: `Q: What is ${topic}?\nA: ${topic} is a comprehensive approach to solving specific challenges in your industry.`,
      paragraph: `${topic} represents a fundamental shift in how businesses approach their core challenges. By leveraging advanced methodologies and proven strategies, organizations can achieve remarkable results.`,
      keywords: `${topic}, professional ${topic}, ${topic} solutions, expert ${topic}, ${topic} services`,
    };

    return placeholders[contentType as keyof typeof placeholders] || `Generated ${contentType} for ${topic}`;
  }

  /**
   * Save enhanced content to database
   */
  async saveEnhancedContent(
    pageId: string,
    contentType: string,
    content: string,
    ragEnhanced: boolean,
    contextSources: string[],
    ragScore: number
  ): Promise<void> {
    try {
      await db.insert(pageContent).values({
        pageId,
        contentType,
        optimizedContent: content,
        aiModel: ragEnhanced ? 'gpt-4-rag' : 'gpt-4',
        generationContext: ragEnhanced ? 'RAG-enhanced generation' : 'Standard generation',
        isActive: 0, // Draft mode
        version: 1,
        metadata: {
          ragEnhanced,
          contextSources,
          ragScore,
          generatedAt: new Date().toISOString(),
        },
        ragEnhanced,
        contextSources,
        ragScore,
      });

      console.log(`Saved enhanced ${contentType} content for page ${pageId}`);
    } catch (error) {
      console.error('Error saving enhanced content:', error);
      throw error;
    }
  }

  /**
   * Batch generate content for multiple pages
   */
  async batchGenerateContent(
    siteId: string,
    pages: Array<{ pageId: string; url: string; topic: string }>,
    contentTypes: string[]
  ): Promise<{
    totalPages: number;
    successfulGenerations: number;
    failedGenerations: number;
    averageRagScore: number;
  }> {
    const results = {
      totalPages: pages.length,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageRagScore: 0,
    };

    const ragScores: number[] = [];

    for (const page of pages) {
      for (const contentType of contentTypes) {
        try {
          const response = await this.generateEnhancedContent({
            siteId,
            pageId: page.pageId,
            contentType: contentType as any,
            topic: page.topic,
            useRAG: true,
          });

          await this.saveEnhancedContent(
            page.pageId,
            contentType,
            response.content,
            response.ragEnhanced,
            response.contextSources,
            response.ragScore
          );

          results.successfulGenerations++;
          if (response.ragScore > 0) {
            ragScores.push(response.ragScore);
          }
        } catch (error) {
          console.error(`Error generating ${contentType} for page ${page.pageId}:`, error);
          results.failedGenerations++;
        }
      }
    }

    results.averageRagScore = ragScores.length > 0
      ? ragScores.reduce((a, b) => a + b, 0) / ragScores.length
      : 0;

    return results;
  }

  /**
   * Get content generation analytics
   */
  async getGenerationAnalytics(siteId: string): Promise<{
    totalGenerations: number;
    ragEnhancedCount: number;
    averageRagScore: number;
    contentTypes: Record<string, number>;
    performanceMetrics: {
      averageResponseTime: number;
      averageContextRetrievalTime: number;
      averageGenerationTime: number;
    };
  }> {
    try {
      const contents = await db.select({
        contentType: pageContent.contentType,
        ragEnhanced: pageContent.ragEnhanced,
        ragScore: pageContent.ragScore,
        metadata: pageContent.metadata,
      })
      .from(pageContent)
      .innerJoin(sites, eq(sites.id, siteId))
      .where(eq(sites.id, siteId));

      const analytics = {
        totalGenerations: contents.length,
        ragEnhancedCount: contents.filter(c => c.ragEnhanced).length,
        averageRagScore: 0,
        contentTypes: {} as Record<string, number>,
        performanceMetrics: {
          averageResponseTime: 0,
          averageContextRetrievalTime: 0,
          averageGenerationTime: 0,
        },
      };

      // Calculate content type distribution
      contents.forEach(content => {
        analytics.contentTypes[content.contentType] = (analytics.contentTypes[content.contentType] || 0) + 1;
      });

      // Calculate average RAG score
      const ragScores = contents.filter(c => c.ragScore).map(c => c.ragScore);
      analytics.averageRagScore = ragScores.length > 0
        ? ragScores.reduce((a, b) => a + (b || 0), 0) / ragScores.length
        : 0;

      return analytics;
    } catch (error) {
      console.error('Error getting generation analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedContentGenerator = new EnhancedContentGenerator(); 