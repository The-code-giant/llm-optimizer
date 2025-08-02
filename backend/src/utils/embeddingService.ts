import OpenAI from 'openai';
import { VectorDocument } from './vectorStore';

export interface TextChunk {
  id: string;
  text: string;
  metadata: {
    siteId: string;
    documentType: string;
    url?: string;
    title?: string;
    [key: string]: any;
  };
}

export interface EmbeddingResult {
  id: string;
  embedding: number[];
  metadata: any;
}

export class EmbeddingService {
  private openai: OpenAI;
  private readonly model = 'text-embedding-3-small';
  private readonly dimension = 1536;
  private readonly batchSize = 100; // OpenAI batch limit

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateEmbeddings(chunks: TextChunk[]): Promise<VectorDocument[]> {
    try {
      if (chunks.length === 0) {
        return [];
      }

      const vectors: VectorDocument[] = [];
      
      // Process in batches
      for (let i = 0; i < chunks.length; i += this.batchSize) {
        const batch = chunks.slice(i, i + this.batchSize);
        
        console.log(`Processing embedding batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(chunks.length / this.batchSize)}`);
        
        const batchVectors = await this.processBatch(batch);
        vectors.push(...batchVectors);
        
        // Rate limiting - wait between batches
        if (i + this.batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Successfully generated ${vectors.length} embeddings`);
      return vectors;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error}`);
    }
  }

  /**
   * Process a batch of text chunks
   */
  private async processBatch(chunks: TextChunk[]): Promise<VectorDocument[]> {
    try {
      const texts = chunks.map(chunk => chunk.text);
      
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      });

      return response.data.map((embedding, index) => ({
        id: chunks[index].id,
        values: embedding.embedding,
        metadata: {
          content: chunks[index].content,
          ...chunks[index].metadata,
        },
      }));
    } catch (error) {
      console.error('Error processing embedding batch:', error);
      throw new Error(`Failed to process embedding batch: ${error}`);
    }
  }

  /**
   * Chunk text into smaller pieces for embedding
   */
  chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
      const chunk = words.slice(i, i + maxChunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  /**
   * Clean and prepare text for embedding
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>]/g, '') // Remove special characters
      .trim()
      .substring(0, 8000); // OpenAI limit
  }

  /**
   * Create text chunks from content
   */
  createTextChunks(
    content: string,
    metadata: {
      siteId: string;
      documentType: string;
      url?: string;
      title?: string;
      [key: string]: any;
    },
    chunkSize: number = 1000
  ): TextChunk[] {
    const cleanedText = this.cleanText(content);
    const chunks = this.chunkText(cleanedText, chunkSize);
    
    return chunks.map((chunk, index) => ({
      id: `${metadata.siteId}-${metadata.documentType}-${Date.now()}-${index}`,
      text: chunk,
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
    }));
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Validate embedding quality
   */
  validateEmbedding(embedding: number[]): boolean {
    return (
      Array.isArray(embedding) &&
      embedding.length === this.dimension &&
      embedding.every(val => typeof val === 'number' && !isNaN(val))
    );
  }

  /**
   * Get embedding statistics
   */
  getEmbeddingStats(embeddings: VectorDocument[]): {
    totalCount: number;
    averageMagnitude: number;
    dimension: number;
  } {
    if (embeddings.length === 0) {
      return { totalCount: 0, averageMagnitude: 0, dimension: this.dimension };
    }

    const magnitudes = embeddings.map(vector => 
      Math.sqrt(vector.values.reduce((sum, val) => sum + val * val, 0))
    );

    const averageMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;

    return {
      totalCount: embeddings.length,
      averageMagnitude,
      dimension: this.dimension,
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService(); 