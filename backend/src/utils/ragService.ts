import OpenAI from 'openai';
import { vectorStoreService, QueryResult } from './vectorStore';
import { embeddingService } from './embeddingService';

export interface RAGQuery {
  siteId: string;
  query: string;
  contextType?: 'content' | 'title' | 'description' | 'faq' | 'paragraph' | 'all';
  maxResults?: number;
  similarityThreshold?: number;
}

export interface RAGResponse {
  response: string;
  contextUsed: QueryResult[];
  performanceMetrics: {
    responseTime: number;
    contextRetrievalTime: number;
    generationTime: number;
    totalTokens: number;
    similarityScores: number[];
  };
  metadata: {
    query: string;
    siteId: string;
    model: string;
    timestamp: Date;
  };
}

export interface RAGContext {
  documents: QueryResult[];
  businessIntelligence: any;
  brandVoice: any;
  targetAudience: any;
}

export class RAGService {
  private openai: OpenAI;
  private readonly model = 'gpt-4';
  private readonly maxTokens = 2000;
  private readonly temperature = 0.7;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * Process a RAG query with context retrieval and enhanced generation
   */
  async processQuery(ragQuery: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Processing RAG query for site ${ragQuery.siteId}: ${ragQuery.query}`);

      // Step 1: Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(ragQuery.query);
      
      // Step 2: Retrieve relevant context
      const contextRetrievalStart = Date.now();
      const context = await this.retrieveContext(ragQuery, queryEmbedding);
      const contextRetrievalTime = Date.now() - contextRetrievalStart;

      // Step 3: Generate enhanced response
      const generationStart = Date.now();
      const response = await this.generateResponse(ragQuery.query, context);
      const generationTime = Date.now() - generationStart;

      const totalTime = Date.now() - startTime;

      return {
        response,
        contextUsed: context.documents,
        performanceMetrics: {
          responseTime: totalTime,
          contextRetrievalTime,
          generationTime,
          totalTokens: 0, // Will be updated from OpenAI response
          similarityScores: context.documents.map(doc => doc.score),
        },
        metadata: {
          query: ragQuery.query,
          siteId: ragQuery.siteId,
          model: this.model,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error('Error processing RAG query:', error);
      throw new Error(`Failed to process RAG query: ${error}`);
    }
  }

  /**
   * Retrieve relevant context from the knowledge base
   */
  private async retrieveContext(ragQuery: RAGQuery, queryEmbedding: number[]): Promise<RAGContext> {
    try {
      // Query the vector store for similar documents
      const documents = await vectorStoreService.querySimilar(
        ragQuery.siteId,
        queryEmbedding,
        ragQuery.maxResults || 5,
        this.buildFilter(ragQuery.contextType)
      );

      // Filter by similarity threshold
      const threshold = ragQuery.similarityThreshold || 0.7;
      const filteredDocuments = documents.filter((doc: QueryResult) => doc.score >= threshold);

      console.log(`Retrieved ${filteredDocuments.length} relevant documents for query`);

      // TODO: Retrieve business intelligence from database
      const businessIntelligence = {};
      const brandVoice = {};
      const targetAudience = {};

      return {
        documents: filteredDocuments,
        businessIntelligence,
        brandVoice,
        targetAudience,
      };
    } catch (error) {
      console.error('Error retrieving context:', error);
      throw new Error(`Failed to retrieve context: ${error}`);
    }
  }

  /**
   * Build filter for vector store query based on context type
   */
  private buildFilter(contextType?: string): any {
    if (!contextType || contextType === 'all') {
      return undefined;
    }

    return {
      documentType: { $eq: contextType },
    };
  }

  /**
   * Generate response using LLM with retrieved context
   */
  private async generateResponse(query: string, context: RAGContext): Promise<string> {
    try {
      // Prepare context for the LLM
      const contextText = this.prepareContextText(context);
      
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(query, contextText);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Prepare context text for the LLM
   */
  private prepareContextText(context: RAGContext): string {
    const documentTexts = context.documents.map(doc => {
      const metadata = doc.metadata;
      return `[Document: ${metadata.title || 'Untitled'}]\n${metadata.content || ''}\n`;
    });

    return documentTexts.join('\n---\n');
  }

  /**
   * Build system prompt with business intelligence
   */
  private buildSystemPrompt(context: RAGContext): string {
    const { businessIntelligence, brandVoice, targetAudience } = context;

    return `You are an AI content assistant for a website. Use the provided context to generate high-quality, relevant content that matches the site's brand voice and target audience.

Key Guidelines:
- Maintain consistency with the site's existing content style
- Use the provided context to ensure accuracy and relevance
- Focus on providing value to the target audience
- Keep the tone professional but approachable
- Ensure the content is SEO-friendly and engaging

Brand Voice: ${JSON.stringify(brandVoice)}
Target Audience: ${JSON.stringify(targetAudience)}
Business Context: ${JSON.stringify(businessIntelligence)}

Generate content that aligns with these characteristics while addressing the user's specific query.`;
  }

  /**
   * Build user prompt with query and context
   */
  private buildUserPrompt(query: string, contextText: string): string {
    return `User Query: ${query}

Relevant Context from the website:
${contextText}

Please generate a response that:
1. Directly addresses the user's query
2. Incorporates relevant information from the provided context
3. Maintains the site's brand voice and style
4. Provides actionable and valuable information
5. Is optimized for both users and search engines

Response:`;
  }

  /**
   * Generate content for specific content types
   */
  async generateContent(
    siteId: string,
    contentType: 'title' | 'description' | 'faq' | 'paragraph',
    topic: string,
    additionalContext?: string
  ): Promise<RAGResponse> {
    const query = this.buildContentQuery(contentType, topic, additionalContext);
    
    return this.processQuery({
      siteId,
      query,
      contextType: contentType,
      maxResults: 8,
      similarityThreshold: 0.6,
    });
  }

  /**
   * Build query for specific content types
   */
  private buildContentQuery(
    contentType: string,
    topic: string,
    additionalContext?: string
  ): string {
    const baseQuery = `Generate ${contentType} for: ${topic}`;
    
    if (additionalContext) {
      return `${baseQuery}\n\nAdditional context: ${additionalContext}`;
    }
    
    return baseQuery;
  }

  /**
   * Analyze content quality and relevance
   */
  async analyzeContentQuality(
    siteId: string,
    content: string,
    targetQuery: string
  ): Promise<{
    relevanceScore: number;
    brandAlignmentScore: number;
    seoScore: number;
    suggestions: string[];
  }> {
    try {
      // Generate embedding for the content
      const contentEmbedding = await embeddingService.generateEmbedding(content);
      const queryEmbedding = await embeddingService.generateEmbedding(targetQuery);

      // Calculate similarity scores
      const relevanceScore = embeddingService.calculateSimilarity(
        contentEmbedding,
        queryEmbedding
      );

      // TODO: Implement more sophisticated analysis
      const brandAlignmentScore = 0.8; // Placeholder
      const seoScore = 0.7; // Placeholder
      const suggestions = [
        'Consider adding more specific keywords',
        'Include a call-to-action',
        'Break up long paragraphs for better readability',
      ];

      return {
        relevanceScore,
        brandAlignmentScore,
        seoScore,
        suggestions,
      };
    } catch (error) {
      console.error('Error analyzing content quality:', error);
      throw new Error(`Failed to analyze content quality: ${error}`);
    }
  }

  /**
   * Get RAG analytics for a site
   */
  async getAnalytics(siteId: string): Promise<{
    totalQueries: number;
    averageResponseTime: number;
    averageSimilarityScore: number;
    mostCommonQueries: string[];
    performanceTrends: any[];
  }> {
    // TODO: Implement analytics from database
    return {
      totalQueries: 0,
      averageResponseTime: 0,
      averageSimilarityScore: 0,
      mostCommonQueries: [],
      performanceTrends: [],
    };
  }
}

// Export singleton instance
export const ragService = new RAGService(); 