import { db } from '../db/client';
import { siteKnowledgeBases, siteDocuments, sites } from '../db/schema';
import { eq } from 'drizzle-orm';
import { siteCrawlerService, CrawlResult } from './siteCrawlerService';
import { embeddingService, TextChunk } from './embeddingService';
import { vectorStoreService, VectorDocument } from './vectorStore';

export interface KnowledgeBaseStatus {
  siteId: string;
  status: 'initializing' | 'processing' | 'ready' | 'error' | 'disabled';
  totalDocuments: number;
  lastRefresh: Date | null;
  errorMessage?: string;
}

export interface DocumentInfo {
  id: string;
  url: string;
  title: string;
  documentType: string;
  status: string;
  wordCount: number;
  lastCrawled: Date | null;
}

export class KnowledgeBaseManager {
  /**
   * Initialize knowledge base for a site
   */
  async initializeKnowledgeBase(siteId: string): Promise<KnowledgeBaseStatus> {
    try {
      console.log(`Initializing knowledge base for site ${siteId}`);

      // Check if knowledge base already exists
      const [existingKB] = await db.select()
        .from(siteKnowledgeBases)
        .where(eq(siteKnowledgeBases.siteId, siteId));

      let knowledgeBase;
      
      if (existingKB) {
        console.log(`Knowledge base already exists for site ${siteId}, resetting status...`);
        
        // Reset existing knowledge base
        [knowledgeBase] = await db.update(siteKnowledgeBases)
          .set({ 
            status: 'initializing',
            totalDocuments: 0,
            errorMessage: null,
            updatedAt: new Date()
          })
          .where(eq(siteKnowledgeBases.siteId, siteId))
          .returning();
      } else {
        console.log(`Creating new knowledge base for site ${siteId}...`);
        
        // Create new knowledge base record
        [knowledgeBase] = await db.insert(siteKnowledgeBases).values({
          siteId,
          status: 'initializing',
          totalDocuments: 0,
        }).returning();
      }

      // Update site with RAG enabled
      await db.update(sites)
        .set({ 
          ragEnabled: true 
        })
        .where(eq(sites.id, siteId));

      // Start the crawling and processing
      await this.processSiteContent(siteId);

      return {
        siteId,
        status: 'ready',
        totalDocuments: 0, // Will be updated after processing
        lastRefresh: new Date(),
      };
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
      
      // Update status to error
      await db.update(siteKnowledgeBases)
        .set({ 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
        .where(eq(siteKnowledgeBases.siteId, siteId));

      throw new Error(`Failed to initialize knowledge base for site ${siteId}: ${error}`);
    }
  }

  /**
   * Process site content and create knowledge base
   */
  private async processSiteContent(siteId: string): Promise<void> {
    try {
      console.log(`Processing content for site ${siteId}`);

      // Update status to processing
      await db.update(siteKnowledgeBases)
        .set({ status: 'processing' })
        .where(eq(siteKnowledgeBases.siteId, siteId));

      // Get site information
      const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
      if (!site) {
        throw new Error(`Site ${siteId} not found`);
      }

      // Crawl the site
      const crawlResult = await siteCrawlerService.crawlSite(siteId, site.url);

      // Process and store documents
      const processedDocuments = await this.processDocuments(siteId, crawlResult);

      // Generate embeddings and store in vector database
      await this.generateAndStoreEmbeddings(siteId, processedDocuments);

      // Update business intelligence
      await this.updateBusinessIntelligence(siteId, crawlResult.businessIntelligence);

      // Update knowledge base status
      await db.update(siteKnowledgeBases)
        .set({
          status: 'ready',
          totalDocuments: processedDocuments.length,
          lastRefresh: new Date(),
        })
        .where(eq(siteKnowledgeBases.siteId, siteId));

      console.log(`Successfully processed ${processedDocuments.length} documents for site ${siteId}`);
    } catch (error) {
      console.error('Error processing site content:', error);
      
      await db.update(siteKnowledgeBases)
        .set({ 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
        .where(eq(siteKnowledgeBases.siteId, siteId));

      throw error;
    }
  }

  /**
   * Process crawled documents and store in database
   */
  private async processDocuments(siteId: string, crawlResult: CrawlResult): Promise<any[]> {
    const processedDocuments = [];

    for (const page of crawlResult.pages) {
      try {
        // Get knowledge base ID
        const [knowledgeBase] = await db.select()
          .from(siteKnowledgeBases)
          .where(eq(siteKnowledgeBases.siteId, siteId));

        if (!knowledgeBase) {
          throw new Error(`Knowledge base not found for site ${siteId}`);
        }

        // Create document record
        const [document] = await db.insert(siteDocuments).values({
          siteId,
          knowledgeBaseId: knowledgeBase.id,
          documentType: page.documentType,
          url: page.url,
          title: page.title,
          content: page.content,
          metadata: page.metadata,
          status: 'pending',
          lastCrawled: new Date(),
        }).returning();

        processedDocuments.push(document);
      } catch (error) {
        console.error(`Error processing document ${page.url}:`, error);
        // Continue with other documents
      }
    }

    return processedDocuments;
  }

  /**
   * Generate embeddings for documents and store in vector database
   */
  private async generateAndStoreEmbeddings(siteId: string, documents: any[]): Promise<void> {
    try {
      console.log(`Generating embeddings for ${documents.length} documents`);

      const vectors: VectorDocument[] = [];

      for (const document of documents) {
        try {
          // Create text chunks
          const chunks = embeddingService.createTextChunks(
            document.content,
            {
              siteId,
              documentType: document.documentType,
              url: document.url,
              title: document.title,
            }
          );

          // Generate embeddings for chunks
          const documentVectors = await embeddingService.generateEmbeddings(chunks);
          vectors.push(...documentVectors);

          // Update document status
          await db.update(siteDocuments)
            .set({ 
              status: 'embedded',
              embeddingId: document.id 
            })
            .where(eq(siteDocuments.id, document.id));

        } catch (error) {
          console.error(`Error generating embeddings for document ${document.id}:`, error);
          
          // Update document status to error
          await db.update(siteDocuments)
            .set({ status: 'error' })
            .where(eq(siteDocuments.id, document.id));
        }
      }

      // Store vectors in Pinecone
      if (vectors.length > 0) {
        await vectorStoreService.upsertEmbeddings(siteId, vectors);
        console.log(`Stored ${vectors.length} vectors in vector database`);
      }

    } catch (error) {
      console.error('Error generating and storing embeddings:', error);
      throw error;
    }
  }

  /**
   * Update business intelligence for a site
   */
  private async updateBusinessIntelligence(siteId: string, businessIntelligence: any): Promise<void> {
    try {
      await db.update(sites)
        .set({
          businessIntelligence,
          brandVoice: businessIntelligence.brandVoice || {},
          targetAudience: businessIntelligence.targetAudience || {},
          servicesSummary: businessIntelligence.services || [],
        })
        .where(eq(sites.id, siteId));

      console.log(`Updated business intelligence for site ${siteId}`);
    } catch (error) {
      console.error('Error updating business intelligence:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base status
   */
  async getKnowledgeBaseStatus(siteId: string): Promise<KnowledgeBaseStatus | null> {
    try {
      const [knowledgeBase] = await db.select()
        .from(siteKnowledgeBases)
        .where(eq(siteKnowledgeBases.siteId, siteId));

      if (!knowledgeBase) {
        return null;
      }

      return {
        siteId,
        status: knowledgeBase.status as any,
        totalDocuments: knowledgeBase.totalDocuments,
        lastRefresh: knowledgeBase.lastRefresh,
        errorMessage: knowledgeBase.errorMessage || undefined,
      };
    } catch (error) {
      console.error('Error getting knowledge base status:', error);
      throw error;
    }
  }

  /**
   * Get documents for a site
   */
  async getDocuments(siteId: string): Promise<DocumentInfo[]> {
    try {
      const documents = await db.select({
        id: siteDocuments.id,
        url: siteDocuments.url,
        title: siteDocuments.title,
        documentType: siteDocuments.documentType,
        status: siteDocuments.status,
        lastCrawled: siteDocuments.lastCrawled,
      })
      .from(siteDocuments)
      .where(eq(siteDocuments.siteId, siteId));

      return documents.map(doc => ({
        ...doc,
        url: doc.url || '', // Handle null URL
        wordCount: 0, // TODO: Calculate word count
        lastCrawled: doc.lastCrawled,
      }));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Refresh knowledge base for a site
   */
  async refreshKnowledgeBase(siteId: string): Promise<void> {
    try {
      console.log(`Refreshing knowledge base for site ${siteId}`);

      // Update status to processing
      await db.update(siteKnowledgeBases)
        .set({ status: 'processing' })
        .where(eq(siteKnowledgeBases.siteId, siteId));

      // Delete existing documents
      await db.delete(siteDocuments)
        .where(eq(siteDocuments.siteId, siteId));

      // Clear vector database
      await vectorStoreService.deleteIndex(siteId);

      // Reprocess site content
      await this.processSiteContent(siteId);

      console.log(`Successfully refreshed knowledge base for site ${siteId}`);
    } catch (error) {
      console.error('Error refreshing knowledge base:', error);
      
      await db.update(siteKnowledgeBases)
        .set({ 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
        .where(eq(siteKnowledgeBases.siteId, siteId));

      throw error;
    }
  }

  /**
   * Delete knowledge base for a site
   */
  async deleteKnowledgeBase(siteId: string): Promise<void> {
    try {
      console.log(`Deleting knowledge base for site ${siteId}`);

      // Delete documents
      await db.delete(siteDocuments)
        .where(eq(siteDocuments.siteId, siteId));

      // Delete knowledge base record
      await db.delete(siteKnowledgeBases)
        .where(eq(siteKnowledgeBases.siteId, siteId));

      // Clear vector database
      await vectorStoreService.deleteIndex(siteId);

      // Update site
      await db.update(sites)
        .set({ 
          ragEnabled: false 
        })
        .where(eq(sites.id, siteId));

      console.log(`Successfully deleted knowledge base for site ${siteId}`);
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getStatistics(siteId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    averageWordCount: number;
    lastRefresh: Date | null;
    vectorStoreStats: any;
  }> {
    try {
      const [knowledgeBase] = await db.select()
        .from(siteKnowledgeBases)
        .where(eq(siteKnowledgeBases.siteId, siteId));

      const documents = await db.select({
        documentType: siteDocuments.documentType,
        content: siteDocuments.content,
      })
      .from(siteDocuments)
      .where(eq(siteDocuments.siteId, siteId));

      // Calculate statistics
      const documentsByType: Record<string, number> = {};
      let totalWordCount = 0;

      for (const doc of documents) {
        documentsByType[doc.documentType] = (documentsByType[doc.documentType] || 0) + 1;
        totalWordCount += doc.content?.split(/\s+/).length || 0;
      }

      // Get vector store statistics
      const vectorStoreStats = await vectorStoreService.getIndexStats(siteId);

      return {
        totalDocuments: documents.length,
        documentsByType,
        averageWordCount: documents.length > 0 ? totalWordCount / documents.length : 0,
        lastRefresh: knowledgeBase?.lastRefresh || null,
        vectorStoreStats,
      };
    } catch (error) {
      console.error('Error getting knowledge base statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const knowledgeBaseManager = new KnowledgeBaseManager(); 