import { db } from '../db/client';
import { sites } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CrawlResult } from './siteCrawlerService';
import { embeddingService } from './embeddingService';
import { vectorStoreService } from './vectorStore';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  constructor() {}

  async initializeKnowledgeBase(siteId: string): Promise<KnowledgeBaseStatus> {
    try {
      console.log(`Initializing knowledge base for site ${siteId}`);
      
      // Get site information
      const site = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
      
      if (site.length === 0) {
        throw new Error(`Site ${siteId} not found`);
      }

      // Update status to processing
      await db.update(sites)
        .set({ 
          ragEnabled: true
        })
        .where(eq(sites.id, siteId));

      // Process site content
      await this.processSiteContent(siteId);

      console.log(`Knowledge base initialized for site ${siteId}`);
      
      return {
        siteId,
        status: 'ready',
        totalDocuments: 0,
        lastRefresh: new Date(),
      };
    } catch (error) {
      console.error(`Error initializing knowledge base for site ${siteId}:`, error);
      
      return {
        siteId,
        status: 'error',
        totalDocuments: 0,
        lastRefresh: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processSiteContent(siteId: string): Promise<void> {
    try {
      // Get site information
      const siteResult = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
      
      if (siteResult.length === 0) {
        throw new Error(`Site ${siteId} not found`);
      }

      const site = siteResult[0];

      // Step 1: Crawl the site to get all pages
      console.log(`Step 1: Crawling site ${site.url}`);
      const { siteCrawlerService } = await import('./siteCrawlerService');
      const crawlResult = await siteCrawlerService.crawlSite(siteId, site.url);
      console.log(`Crawled ${crawlResult.pages.length} pages`);

      // Step 2: Process and store all documents
      console.log(`Step 2: Processing and storing documents`);
      const processedDocuments = await this.processDocuments(siteId, crawlResult);

      // Step 3: Generate embeddings and store in vector database
      console.log(`Step 3: Generating embeddings and storing in vector database`);
      await this.generateAndStoreEmbeddings(siteId, processedDocuments);

      // Step 4: Generate business intelligence using RAG
      console.log(`Step 4: Generating business intelligence using RAG`);
      const businessIntelligence = await this.generateBusinessIntelligenceFromTrainedAI(siteId, crawlResult.pages);

      // Step 5: Update business intelligence in database
      console.log(`Step 5: Updating business intelligence in database`);
      await this.updateBusinessIntelligence(siteId, businessIntelligence);

      console.log(`Knowledge base processing completed for site ${siteId}`);
    } catch (error) {
      console.error(`Error processing site content for ${siteId}:`, error);
      throw error;
    }
  }

  private async processDocuments(siteId: string, crawlResult: CrawlResult): Promise<any[]> {
    const documents = [];

    for (const page of crawlResult.pages) {
      try {
        // Create document record
        const document = {
          siteId,
          url: page.url,
          title: page.title || '',
          content: page.content,
          documentType: page.documentType || 'unknown',
          wordCount: page.content.split(/\s+/).length,
          lastCrawled: new Date(),
          status: 'processed'
        };

        documents.push(document);
      } catch (error) {
        console.error(`Error processing document ${page.url}:`, error);
      }
    }

    return documents;
  }

  /**
   * Generate embeddings for documents and store in vector database
   */
  private async generateAndStoreEmbeddings(siteId: string, documents: any[]): Promise<void> {
    try {
      console.log(`Generating embeddings for ${documents.length} documents`);
      
      // Generate embeddings for each document
      const vectors = [];
      
      for (const doc of documents) {
        try {
          // Generate embedding for the document content
          const embedding = await embeddingService.generateEmbedding(doc.content);
          
          // Prepare vector document
          const vectorDoc = {
            id: `${siteId}-${doc.url}`,
            values: embedding,
            metadata: {
              url: doc.url,
              title: doc.title,
              content: doc.content,
              documentType: doc.documentType,
              siteId: siteId,
              wordCount: doc.wordCount
            }
          };
          
          vectors.push(vectorDoc);
        } catch (error) {
          console.error(`Error generating embedding for ${doc.url}:`, error);
        }
      }

      // Store all vectors in vector database
      if (vectors.length > 0) {
        await vectorStoreService.upsertEmbeddings(siteId, vectors);
      }

      console.log(`Generated and stored embeddings for ${documents.length} documents`);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  private async generateBusinessIntelligenceFromTrainedAI(siteId: string, pages: any[]): Promise<any> {
    try {
      console.log('Generating business intelligence from trained AI...');

      // Filter quality pages (exclude low-content, auth, legal pages)
      const qualityPages = pages.filter(page => {
        const url = page.url.toLowerCase();
        const skipPatterns = [
          '/signup', '/login', '/register', '/auth', '/admin', '/dashboard',
          '/cart', '/checkout', '/account', '/profile', '/settings',
          '/privacy', '/terms', '/cookies', '/legal'
        ];
        
        return page.content.length > 100 && 
               !skipPatterns.some(pattern => url.includes(pattern));
      });

      // Combine all content and titles
      const allContent = qualityPages.map(p => p.content).join(' ');
      const allTitles = qualityPages.map(p => p.title).join(' ');

      // Prepare service pages info
      const servicePagesInfo = qualityPages
        .filter(p => p.documentType === 'service')
        .map(p => ({
          url: p.url,
          title: p.title,
          content: p.content.substring(0, 200)
        }));

      // Generate business intelligence using AI
      const businessIntelligence = await this.analyzeBusinessIntelligenceWithAI(
        siteId,
        qualityPages,
        allContent,
        allTitles,
        servicePagesInfo
      );

      console.log('Business intelligence generated successfully');
      return businessIntelligence;
    } catch (error) {
      console.error('Error generating business intelligence:', error);
      return this.getDefaultBusinessIntelligence();
    }
  }

  /**
   * Analyze business intelligence using RAG with embedded content
   */
  private async analyzeBusinessIntelligenceWithAI(
    siteId: string,
    pages: any[],
    content: string,
    titles: string,
    servicePagesInfo: any[]
  ): Promise<any> {
    try {
      console.log('Starting RAG-based business intelligence analysis...');

      // Step 1: Use RAG to retrieve relevant content for each analysis aspect
      const ragResults = await this.performRAGAnalysis(siteId, pages);

      // Step 2: Create focused prompts using retrieved context
      const brandVoiceAnalysis = await this.analyzeBrandVoiceWithRAG(ragResults.brandVoice);
      const targetAudienceAnalysis = await this.analyzeTargetAudienceWithRAG(ragResults.targetAudience);
      const businessContextAnalysis = await this.analyzeBusinessContextWithRAG(ragResults.businessContext);
      const servicesAnalysis = await this.analyzeServicesWithRAG(ragResults.services, servicePagesInfo);

      // Step 3: Combine all analyses into comprehensive business intelligence
      const businessIntelligence = {
        brandVoice: brandVoiceAnalysis,
        targetAudience: targetAudienceAnalysis,
        businessContext: businessContextAnalysis,
        contentGuidelines: await this.generateContentGuidelines(brandVoiceAnalysis, targetAudienceAnalysis),
        services: servicesAnalysis,
        contactInfo: await this.extractContactInfo(pages) // Search all pages for contact info
      };

      console.log('RAG-based business intelligence analysis completed');
      return businessIntelligence;
    } catch (error) {
      console.error('Error in RAG business intelligence analysis:', error);
      return this.getDefaultBusinessIntelligence();
    }
  }

  /**
   * Perform RAG analysis to retrieve relevant content for each aspect
   */
  private async performRAGAnalysis(siteId: string, pages: any[]): Promise<any> {
    const results: {
      brandVoice: any[];
      targetAudience: any[];
      businessContext: any[];
      services: any[];
    } = {
      brandVoice: [],
      targetAudience: [],
      businessContext: [],
      services: []
    };

    try {
      // Query for brand voice related content
      const brandVoiceQuery = "brand voice tone style personality company identity name";
      const brandVoiceResults = await this.queryRAG(siteId, brandVoiceQuery);
      results.brandVoice.push(...brandVoiceResults);

      // Query for target audience related content
      const audienceQuery = "target audience customers users who we serve B2B B2C business consumer";
      const audienceResults = await this.queryRAG(siteId, audienceQuery);
      results.targetAudience.push(...audienceResults);

      // Query for business context
      const businessQuery = "value proposition benefits features industry market what we do";
      const businessResults = await this.queryRAG(siteId, businessQuery);
      results.businessContext.push(...businessResults);

      // Query for services
      const servicesQuery = "services products features solutions what we offer pricing plans";
      const servicesResults = await this.queryRAG(siteId, servicesQuery);
      results.services.push(...servicesResults);
    } catch (error) {
      console.error(`Error performing RAG analysis for site ${siteId}:`, error);
    }

    return results;
  }

  /**
   * Query RAG system for relevant content
   */
  private async queryRAG(siteId: string, query: string): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Search for similar content in the vector store using the actual siteId
      const searchResults = await vectorStoreService.querySimilar(
        siteId, // Use the actual site ID
        queryEmbedding,
        5 // Get top 5 results
      );

      return searchResults.map(result => ({
        content: result.metadata.content,
        score: result.score,
        url: result.metadata.url
      }));
    } catch (error) {
      console.error(`Error querying RAG for site ${siteId}:`, error);
      return [];
    }
  }

  /**
   * Analyze brand voice using RAG-retrieved content
   */
  private async analyzeBrandVoiceWithRAG(ragResults: any[]): Promise<any> {
    if (ragResults.length === 0) {
      return { tone: { casual: 3, formal: 3, technical: 3 }, companyName: 'Unknown', primaryKeywords: [], writingStyle: 'Professional', brandPersonality: 'Reliable' };
    }

    const context = ragResults.map(r => r.content).join(' ');
    
    const prompt = `Analyze the brand voice from this website content. Extract REAL information, not placeholder text.

CONTENT TO ANALYZE:
${context.substring(0, 3000)}

Provide a JSON response with ACTUAL extracted information:
{
  "tone": {
    "casual": 1-5,
    "formal": 1-5,
    "technical": 1-5
  },
  "companyName": "ACTUAL company name found or inferred from content (e.g., from titles, logos, or product names; not 'extracted name')",
  "primaryKeywords": ["ACTUAL important keywords from content that describe the business, services, or products (extract at least 3-5 if possible)"],
  "writingStyle": "ACTUAL writing style observed in content (e.g., conversational, authoritative)",
  "brandPersonality": "ACTUAL brand personality conveyed in content (e.g., innovative, trustworthy)"
}

IMPORTANT: 
- For company name: Prioritize extraction from reliable sources like page titles, copyright notices, about sections, or repeated brand mentions. Confirm with multiple indicators if possible. If no clear name, use 'Unknown' rather than guessing.
- Extract or infer the REAL company name mentioned or implied in the content. For example, if the site talks about 'Acme SEO Tools', infer 'Acme' as company name.
- Find ACTUAL keywords that appear frequently and are meaningful to the business. Aim for 3-8 relevant keywords.
- Describe the REAL writing style and personality observed.
- DO NOT use placeholder text like "keyword1", "extracted name", etc.
- If information cannot be determined, use thoughtful fallbacks based on the content's theme.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a brand analysis expert. Extract and infer REAL information from content, never use placeholder text. Respond with only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Slightly higher for better inference
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned || '{}');
      
      // Validate that we don't have placeholder data
      if (parsed.companyName === 'extracted name' || parsed.companyName === 'ACTUAL company name found in content (not \'extracted name\')') {
        parsed.companyName = 'Unknown';
      }
      
      if (Array.isArray(parsed.primaryKeywords) && parsed.primaryKeywords.some((k: string) => k.includes('keyword'))) {
        parsed.primaryKeywords = [];
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing brand voice analysis:', error);
      return { tone: { casual: 3, formal: 3, technical: 3 }, companyName: 'Unknown', primaryKeywords: [], writingStyle: 'Professional', brandPersonality: 'Reliable' };
    }
  }

  /**
   * Analyze target audience using RAG-retrieved content
   */
  private async analyzeTargetAudienceWithRAG(ragResults: any[]): Promise<any> {
    if (ragResults.length === 0) {
      return { b2b: 3, b2c: 3, technical: 3, nonTechnical: 3, audienceDescription: 'General business audience' };
    }

    const context = ragResults.map(r => r.content).join(' ');
    
    const prompt = `Analyze the target audience from this website content. Extract REAL information, not placeholder text.

CONTENT TO ANALYZE:
${context.substring(0, 2000)}

Provide a JSON response with ACTUAL extracted or inferred information:
{
  "b2b": 1-5,
  "b2c": 1-5,
  "technical": 1-5,
  "nonTechnical": 1-5,
  "audienceDescription": "ACTUAL description of the target audience based on content"
}

IMPORTANT:
- Rate the audience focus based on content indicators.
- Infer audience if not explicit, e.g., if content discusses enterprise solutions, rate B2B higher.
- Provide a detailed description of the audience demographics, needs, and characteristics observed or inferred from the content.
- DO NOT use placeholder text.
- If unclear, use reasonable defaults based on content theme.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an audience analysis expert. Extract and infer REAL information from content. Respond with only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    try {
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned || '{}');
    } catch (error) {
      return { b2b: 3, b2c: 3, technical: 3, nonTechnical: 3, audienceDescription: 'General business audience' };
    }
  }

  /**
   * Analyze business context using RAG-retrieved content
   */
  private async analyzeBusinessContextWithRAG(ragResults: any[]): Promise<any> {
    const context = ragResults.map(r => r.content).join(' ');
    
    const prompt = `Analyze the business context from this content. Provide JSON response:
{
  "industry": "industry name",
  "valueProposition": "main value prop",
  "painPoints": ["point1", "point2"],
  "benefits": ["benefit1", "benefit2"],
  "uniqueFeatures": ["feature1", "feature2"]
}

Content: ${context.substring(0, 3000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Analyze business context. Respond with only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    try {
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned || '{}');
    } catch (error) {
      return { industry: 'Technology', valueProposition: 'Innovative solutions' };
    }
  }

  /**
   * Analyze services using RAG-retrieved content
   */
  private async analyzeServicesWithRAG(ragResults: any[], servicePagesInfo: any[]): Promise<any[]> {
    if (ragResults.length === 0 && servicePagesInfo.length === 0) {
      return [];
    }

    const context = ragResults.map(r => r.content).join(' ');
    
    const prompt = `Analyze the ACTUAL services offered by this company from the content and service pages. Extract REAL service information.

CONTENT TO ANALYZE:
${context.substring(0, 2000)}

AVAILABLE SERVICE PAGES:
${JSON.stringify(servicePagesInfo, null, 2)}

Provide a JSON array of ACTUAL services with REAL information:
[
  {
    "title": "REAL service name (not 'service name')",
    "description": "ACTUAL description of what this service does",
    "url": "ACTUAL URL from the service pages provided above"
  }
]

IMPORTANT:
- Extract REAL service names and descriptions from the content
- Use ONLY URLs that exist in the service pages provided
- DO NOT use placeholder text like "service name", "description"
- If no specific services can be identified, return an empty array []
- Focus on the main services/products the company actually offers`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a service analysis expert. Extract REAL service information from content, never use placeholder text. Respond with only valid JSON array.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned || '[]');
      
      // Filter out placeholder services
      const validServices = Array.isArray(parsed) ? parsed.filter((service: any) => 
        service.title && 
        service.title !== 'service name' && 
        service.title !== 'Website Services' &&
        service.description &&
        service.description !== 'description' &&
        service.description !== 'Various services'
      ) : [];
      
      return validServices;
    } catch (error) {
      console.error('Error parsing services analysis:', error);
      return [];
    }
  }

  /**
   * Generate content guidelines based on brand voice and target audience
   */
  private async generateContentGuidelines(brandVoice: any, targetAudience: any): Promise<any> {
    const prompt = `Generate content guidelines based on:
Brand Voice: ${JSON.stringify(brandVoice)}
Target Audience: ${JSON.stringify(targetAudience)}

Provide JSON response:
{
  "tone": "recommendations",
  "style": "guidelines",
  "keywords": ["keyword1", "keyword2"],
  "avoidTerms": ["term1", "term2"],
  "callToAction": "style"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Generate content guidelines. Respond with only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 400,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    try {
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned || '{}');
    } catch (error) {
      return { tone: 'Professional', style: 'Clear writing', keywords: ['solution'], avoidTerms: ['complicated'] };
    }
  }

  /**
   * Get default business intelligence when analysis fails
   */
  private getDefaultBusinessIntelligence(): any {
    return {
      brandVoice: {
        tone: { casual: 3, formal: 3, technical: 3 },
        companyName: 'Unknown',
        primaryKeywords: ['business', 'service', 'company', 'solution', 'platform'],
        writingStyle: 'Professional and clear',
        brandPersonality: 'Reliable and trustworthy'
      },
      targetAudience: {
        b2b: 3, b2c: 3, technical: 3, nonTechnical: 3,
        audienceDescription: 'General business audience'
      },
      businessContext: {
        industry: 'Technology',
        valueProposition: 'Innovative solutions for business needs',
        painPoints: ['Complex processes', 'Time management'],
        benefits: ['Efficiency', 'Cost savings'],
        uniqueFeatures: ['User-friendly interface', 'Advanced technology']
      },
      contentGuidelines: {
        tone: 'Professional yet approachable',
        style: 'Clear and concise writing',
        keywords: ['solution', 'efficient', 'professional'],
        avoidTerms: ['complicated', 'difficult'],
        callToAction: 'Direct and action-oriented'
      },
      services: [
        {
          title: 'Website Services',
          description: 'Various services offered by this website',
          url: ''
        }
      ],
      contactInfo: {
        emails: [],
        phones: [],
        address: ''
      }
    };
  }

  /**
   * Extract company name from titles
   */
  private extractCompanyName(titles: string): string {
    const titleWords = titles.split(/\s+/);
    const commonWords = ['home', 'welcome', 'about', 'contact', 'services', 'blog'];
    
    for (const word of titleWords) {
      if (word.length > 2 && !commonWords.includes(word.toLowerCase())) {
        return word;
      }
    }
    return 'Unknown';
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string, count: number): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount: { [key: string]: number } = {};
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([word]) => word);
  }

  /**
   * Extract services from pages
   */
  private extractServices(pages: any[]): any[] {
    const services: any[] = [];

    for (const page of pages) {
      const url = page.url.toLowerCase();
      const skipPatterns = [
        '/signup', '/login', '/register', '/auth', '/admin', '/dashboard',
        '/cart', '/checkout', '/account', '/profile', '/settings',
        '/privacy', '/terms', '/cookies', '/legal'
      ];
      
      if (skipPatterns.some(pattern => url.includes(pattern))) {
        continue;
      }

      if (page.documentType === 'service' || url.includes('/service') || url.includes('/product')) {
        services.push({
          title: page.title || 'Service',
          description: page.content.substring(0, 200),
          url: page.url
        });
      }
    }

    return services.length > 0 ? services : [
      {
        title: 'Website Services',
        description: 'Various services offered by this website',
        url: ''
      }
    ];
  }

  /**
   * Extract contact information from pages
   */
  private async extractContactInfo(pages: any[]): Promise<any> {
    const contactInfo = {
      emails: [] as string[],
      phones: [] as string[],
      address: ''
    };

    for (const page of pages) {
      const content = page.content.toLowerCase();
      
      // Extract emails
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = content.match(emailRegex);
      if (emails) {
        contactInfo.emails.push(...emails);
      }

      // Extract phone numbers
      const phoneRegex = /(\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/g;
      const phones = content.match(phoneRegex);
      if (phones) {
        contactInfo.phones.push(...phones);
      }

      // Extract address
      if (!contactInfo.address) {
        contactInfo.address = this.extractAddress(page.content);
      }
    }

    return contactInfo;
  }

  /**
   * Extract address from content
   */
  private extractAddress(content: string): string {
    // Simple address extraction - look for common address patterns
    const addressPatterns = [
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct)/i,
      /\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/i
    ];

    for (const pattern of addressPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return '';
  }

  /**
   * Update business intelligence in database
   */
  private async updateBusinessIntelligence(siteId: string, businessIntelligence: any): Promise<void> {
    try {
      console.log('Updating business intelligence in database...');
      console.log('Business Intelligence Structure:', JSON.stringify(businessIntelligence, null, 2));

      await db.update(sites)
        .set({ 
          businessIntelligence: businessIntelligence
        })
        .where(eq(sites.id, siteId));

      console.log('Business intelligence updated successfully');
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
      const site = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
      
      if (site.length === 0) {
        return null;
      }

      return {
        siteId,
        status: site[0].ragEnabled ? 'ready' : 'disabled',
        totalDocuments: 0,
        lastRefresh: null,
      };
    } catch (error) {
      console.error(`Error getting knowledge base status for ${siteId}:`, error);
      return null;
    }
  }

  /**
   * Get documents for a site
   */
  async getDocuments(siteId: string): Promise<DocumentInfo[]> {
    try {
      // This would typically query a documents table
      // For now, return empty array as documents are stored in vector store
      return [];
    } catch (error) {
      console.error(`Error getting documents for ${siteId}:`, error);
      return [];
    }
  }

  /**
   * Refresh knowledge base
   */
  async refreshKnowledgeBase(siteId: string): Promise<void> {
    try {
      console.log(`Refreshing knowledge base for site ${siteId}`);
      
      // Process site content
      await this.processSiteContent(siteId);

      console.log(`Knowledge base refreshed for site ${siteId}`);
    } catch (error) {
      console.error(`Error refreshing knowledge base for ${siteId}:`, error);
      throw error;
    }
  }

  /**
   * Delete knowledge base
   */
  async deleteKnowledgeBase(siteId: string): Promise<void> {
    try {
      console.log(`Deleting knowledge base for site ${siteId}`);
      
      // Delete vector store data for this site
      await vectorStoreService.deleteSiteData(siteId);
      
      // Update database
      await db.update(sites)
        .set({ 
          ragEnabled: false,
          businessIntelligence: null
        })
        .where(eq(sites.id, siteId));

      console.log(`Knowledge base deleted for site ${siteId}`);
    } catch (error) {
      console.error(`Error deleting knowledge base for ${siteId}:`, error);
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
      const site = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
      
      if (site.length === 0) {
        return {
          totalDocuments: 0,
          documentsByType: {},
          averageWordCount: 0,
          lastRefresh: null,
          vectorStoreStats: {}
        };
      }

      return {
        totalDocuments: 0,
        documentsByType: {},
        averageWordCount: 0,
        lastRefresh: null,
        vectorStoreStats: {}
      };
    } catch (error) {
      console.error(`Error getting statistics for ${siteId}:`, error);
      return {
        totalDocuments: 0,
        documentsByType: {},
        averageWordCount: 0,
        lastRefresh: null,
        vectorStoreStats: {}
      };
    }
  }

  private cleanJsonResponse(response: string | undefined): string {
    return (response || '')
      .replace(/```json\n/g, '')
      .replace(/```/g, '')
      .trim();
  }
}

export const knowledgeBaseManager = new KnowledgeBaseManager(); 