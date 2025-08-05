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
  private readonly indexName = 'clever-search-index'; // Single index for all sites

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  async initializeIndex(): Promise<any> {
    try {
      // Try to get existing index
      const index = this.pinecone.index(this.indexName);
      await index.describeIndexStats();
      console.log(`Index ${this.indexName} exists and is ready`);
      return index;
    } catch (error) {
      console.log(`Index ${this.indexName} not found, creating...`);
      
      // Create new index
      await this.pinecone.createIndex({
        name: this.indexName,
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
      console.log(`Waiting for index ${this.indexName} to be ready...`);
      await this.waitForIndexReady();
      
      // Return the index object
      return this.pinecone.index(this.indexName);
    }
  }

  private async waitForIndexReady(maxWaitTime = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const index = this.pinecone.index(this.indexName);
        await index.describeIndexStats();
        console.log(`Index ${this.indexName} is ready!`);
        return;
      } catch (error) {
        console.log(`Index ${this.indexName} not ready yet, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    
    throw new Error(`Index ${this.indexName} failed to become ready within ${maxWaitTime}ms`);
  }

  async upsertEmbeddings(siteId: string, vectors: VectorDocument[]): Promise<any> {
    const index = await this.initializeIndex();
    
    // Add siteId to each vector ID to ensure uniqueness across namespaces
    const vectorsWithNamespace = vectors.map(vector => ({
      ...vector,
      id: `${siteId}-${vector.id}`,
    }));

    return index.namespace(siteId).upsert(vectorsWithNamespace);
  }

  async querySimilar(
    siteId: string,
    queryEmbedding: number[],
    topK: number = 5,
    filter?: any
  ): Promise<QueryResult[]> {
    const index = await this.initializeIndex();
    
    const queryResponse = await index.namespace(siteId).query({
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
    const index = await this.initializeIndex();
    
    // Add siteId prefix to IDs to match the namespace format
    const idsWithNamespace = ids.map(id => `${siteId}-${id}`);
    
    return index.namespace(siteId).deleteMany(idsWithNamespace);
  }

  async getIndexStats(siteId?: string): Promise<any> {
    const index = await this.initializeIndex();
    
    if (siteId) {
      // Get stats for specific namespace
      return index.namespace(siteId).describeIndexStats();
    } else {
      // Get overall index stats
      return index.describeIndexStats();
    }
  }

  async isIndexReady(): Promise<boolean> {
    try {
      const index = await this.initializeIndex();
      await index.describeIndexStats();
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteSiteData(siteId: string): Promise<void> {
    const index = await this.initializeIndex();
    
    try {
      // Delete all vectors in the namespace for this site
      // Note: Pinecone doesn't have a direct "delete namespace" method
      // We'll need to query and delete all vectors in the namespace
      const allVectors = await index.namespace(siteId).query({
        vector: new Array(this.dimension).fill(0), // Dummy vector
        topK: 10000, // Large number to get all vectors
        includeMetadata: false,
      });

      if (allVectors.matches && allVectors.matches.length > 0) {
        const idsToDelete = allVectors.matches.map((match: any) => match.id);
        await index.namespace(siteId).deleteMany(idsToDelete);
        console.log(`Deleted ${idsToDelete.length} vectors for site ${siteId}`);
      }
    } catch (error) {
      console.error(`Failed to delete data for site ${siteId}:`, error);
    }
  }

  async deleteIndex(): Promise<void> {
    try {
      await this.pinecone.deleteIndex(this.indexName);
    } catch (error) {
      console.error(`Failed to delete index ${this.indexName}:`, error);
    }
  }
}

export const vectorStoreService = new VectorStoreService(); 