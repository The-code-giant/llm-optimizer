import { Pinecone } from '@pinecone-database/pinecone';

export interface VectorDocument {
  id: string;
  values: number[];
  metadata: {
    content: string;
    title?: string;
    url?: string;
    documentType: string;
    siteId: string;
    [key: string]: any;
  };
}

export interface QueryResult {
  id: string;
  score: number;
  metadata: {
    content: string;
    title?: string;
    url?: string;
    documentType: string;
    siteId: string;
    [key: string]: any;
  };
}

export class VectorStoreService {
  private pinecone: Pinecone;
  private readonly dimension = 1536;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  async initializeIndex(siteId: string): Promise<any> {
    const indexName = `site-${siteId}`;
    
    try {
      // Try to get existing index
      const index = this.pinecone.index(indexName);
      await index.describeIndexStats();
      console.log(`Index ${indexName} exists and is ready`);
      return index;
    } catch (error) {
      console.log(`Index ${indexName} not found, creating...`);
      
      // Create new index
      await this.pinecone.createIndex({
        name: indexName,
        dimension: this.dimension,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      // Wait for index to be ready
      console.log(`Waiting for index ${indexName} to be ready...`);
      await this.waitForIndexReady(indexName);
      
      // Return the index object
      return this.pinecone.index(indexName);
    }
  }

  private async waitForIndexReady(indexName: string, maxWaitTime = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const index = this.pinecone.index(indexName);
        await index.describeIndexStats();
        console.log(`Index ${indexName} is ready!`);
        return;
      } catch (error) {
        console.log(`Index ${indexName} not ready yet, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    
    throw new Error(`Index ${indexName} failed to become ready within ${maxWaitTime}ms`);
  }

  async upsertEmbeddings(siteId: string, vectors: VectorDocument[]): Promise<any> {
    const index = await this.initializeIndex(siteId);
    return index.upsert(vectors);
  }

  async querySimilar(
    siteId: string,
    queryEmbedding: number[],
    topK: number = 5,
    filter?: any
  ): Promise<QueryResult[]> {
    const index = await this.initializeIndex(siteId);
    
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      filter,
      includeMetadata: true,
    });

    return queryResponse.matches?.map((match: any) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as any,
    })) || [];
  }

  async deleteDocuments(siteId: string, ids: string[]): Promise<any> {
    const index = await this.initializeIndex(siteId);
    return index.deleteMany(ids);
  }

  async getIndexStats(siteId: string): Promise<any> {
    const index = await this.initializeIndex(siteId);
    return index.describeIndexStats();
  }

  async isIndexReady(siteId: string): Promise<boolean> {
    try {
      const index = await this.initializeIndex(siteId);
      await index.describeIndexStats();
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteIndex(siteId: string): Promise<void> {
    const indexName = `site-${siteId}`;
    try {
      await this.pinecone.deleteIndex(indexName);
    } catch (error) {
      console.error(`Failed to delete index ${indexName}:`, error);
    }
  }
}

export const vectorStoreService = new VectorStoreService(); 