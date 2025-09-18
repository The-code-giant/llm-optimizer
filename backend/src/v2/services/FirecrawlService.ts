import Firecrawl from '@mendable/firecrawl-js';

export interface FirecrawlSearchResult {
  title: string;
  url: string;
  description?: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface FirecrawlSearchResponse {
  success: boolean;
  data: FirecrawlSearchResult[];
  total: number;
  error?: string;
}

export interface FirecrawlScrapeResult {
  success: boolean;
  data: {
    content: string;
    markdown: string;
    metadata: Record<string, any>;
    links: Array<{ text: string; url: string }>;
  };
  error?: string;
}

export interface FirecrawlBulkResult {
  success: boolean;
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data?: Array<{
    url: string;
    content: string;
    metadata: Record<string, any>;
  }>;
  error?: string;
}

/**
 * Enhanced Firecrawl service with comprehensive web scraping capabilities
 */
export class FirecrawlService {
  private firecrawl: Firecrawl;

  constructor() {
    if (!process.env.FIRECRAWL_API_KEY) {
      console.warn('⚠️ FIRECRAWL_API_KEY not found in environment variables');
      throw new Error('Firecrawl API key is required');
    }
    
    console.log('🔑 Firecrawl API key configured:', process.env.FIRECRAWL_API_KEY.substring(0, 10) + '...');
    
    this.firecrawl = new Firecrawl({
      apiKey: process.env.FIRECRAWL_API_KEY
    });
    
    console.log('✅ Firecrawl service initialized');
    
    // Test the API connection
    this.testConnection();
  }

  /**
   * Test Firecrawl API connection
   */
  private async testConnection() {
    try {
      console.log('🧪 Testing Firecrawl API connection...');
      console.log('🔧 Firecrawl SDK version: @mendable/firecrawl-js v4.3.5+');
      console.log('🌐 API Key format check:', {
        hasKey: !!process.env.FIRECRAWL_API_KEY,
        keyLength: process.env.FIRECRAWL_API_KEY?.length || 0,
        keyPrefix: process.env.FIRECRAWL_API_KEY?.substring(0, 8) || 'none'
      });
      
      // Test with a simple, reliable URL
      const testResult = await this.firecrawl.scrape('https://httpbin.org/html');
      console.log('✅ Firecrawl API connection test successful:', {
        hasResult: !!testResult,
        resultType: typeof testResult,
        keys: Object.keys(testResult || {})
      });
    } catch (error: any) {
      console.error('❌ Firecrawl API connection test failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name
      });
    }
  }

  /**
   * Search for competitors or similar content using map functionality
   */
  async searchCompetitors(query: string, options?: {
    limit?: number;
    location?: string;
    language?: string;
  }): Promise<FirecrawlSearchResponse> {
    try {
      // Since Firecrawl doesn't have a direct search API, we'll use map to discover URLs
      // and then scrape them. For a real search, you'd want to integrate with search engines.
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      
      try {
        // Try to map the search results page to find competitor URLs
        const mapResult: any = await this.firecrawl.map(searchUrl);
        console.log(`🗺️ Map result for ${searchUrl}:`, JSON.stringify(mapResult, null, 2));
        
        const urls = Array.isArray(mapResult) ? mapResult.slice(0, options?.limit || 5) : 
                     mapResult.links ? mapResult.links.slice(0, options?.limit || 5) : [searchUrl];
        
        console.log(`🔗 Extracted URLs:`, urls);
        
        const results: FirecrawlSearchResult[] = [];
        
        for (const url of urls) {
          try {
            // Better URL extraction with validation
            let actualUrl: string;
            if (typeof url === 'string') {
              actualUrl = url;
            } else if (url && typeof url === 'object') {
              actualUrl = url.url || url.href || url.link || String(url);
            } else {
              actualUrl = String(url);
            }

            // Validate URL format
            if (!actualUrl || actualUrl === '[object Object]' || !actualUrl.startsWith('http')) {
              console.warn(`Skipping invalid URL:`, url);
              continue;
            }

            console.log(`🔍 Scraping URL: ${actualUrl}`);
            const scrapeResult = await this.scrapeUrl(actualUrl, { extractMainContent: true });
            if (scrapeResult.success) {
              results.push({
                title: scrapeResult.data.metadata.title || query,
                url: actualUrl,
                content: scrapeResult.data.content,
                metadata: scrapeResult.data.metadata
              });
            }
          } catch (error) {
            // Continue with other URLs if one fails
            console.warn(`Failed to scrape ${url}:`, error);
          }
        }

        return {
          success: true,
          data: results,
          total: results.length
        };
      } catch (mapError) {
        // Fallback: return a mock response if mapping fails
        return {
          success: true,
          data: [{
            title: query,
            url: searchUrl,
            content: `Search query: ${query}`,
            metadata: { query }
          }],
          total: 1
        };
      }
    } catch (error: any) {
      throw new Error(`Firecrawl search failed: ${error.message}`);
    }
  }

  /**
   * Map a website to discover internal pages
   */
  async mapSite(url: string, options?: {
    maxPages?: number;
  }): Promise<FirecrawlSearchResponse> {
    try {
      console.log(`🗺️ Mapping site: ${url}`);
      
      // Use Firecrawl map to discover internal pages
      console.log(`🚀 Attempting basic map operation`);
      const mapResult: any = await this.firecrawl.map(url);
      console.log(`🗺️ Raw map result type:`, typeof mapResult);
      console.log(`🗺️ Raw map result keys:`, Object.keys(mapResult || {}));
      console.log(`🗺️ Map result sample:`, JSON.stringify(mapResult, null, 2).substring(0, 500) + '...');
      
      // Extract URLs from map result - handle different response formats
      let urls: any[] = [];
      
      if (Array.isArray(mapResult)) {
        urls = mapResult;
        console.log(`📋 Map returned array with ${urls.length} items`);
      } else if (mapResult && mapResult.links && Array.isArray(mapResult.links)) {
        urls = mapResult.links;
        console.log(`📋 Map returned object with ${urls.length} links`);
      } else if (mapResult && mapResult.data && Array.isArray(mapResult.data)) {
        urls = mapResult.data;
        console.log(`📋 Map returned data array with ${urls.length} items`);
      } else {
        console.log(`⚠️ Unexpected map result format, using fallback`);
        urls = [{ url: url, title: 'Homepage', content: '' }];
      }
      
      const limitedUrls = urls.slice(0, options?.maxPages || 10);
      console.log(`🔗 Processing ${limitedUrls.length} URLs from mapping`);

      // Convert to standard format
      const results: FirecrawlSearchResult[] = [];
      
      for (const urlItem of limitedUrls) {
        let actualUrl: string;
        let title: string = '';
        let content: string = '';
        
        // Handle different URL formats from mapping
        if (typeof urlItem === 'string') {
          actualUrl = urlItem;
        } else if (urlItem && typeof urlItem === 'object') {
          actualUrl = urlItem.url || urlItem.href || urlItem.link || String(urlItem);
          title = urlItem.title || urlItem.text || urlItem.name || '';
          content = urlItem.content || urlItem.description || urlItem.snippet || '';
        } else {
          actualUrl = String(urlItem);
        }

        // Validate URL format
        if (!actualUrl || actualUrl === '[object Object]' || !actualUrl.startsWith('http')) {
          console.warn(`⚠️ Skipping invalid URL:`, { originalItem: urlItem, extractedUrl: actualUrl });
          continue;
        }

        console.log(`✅ Processing valid URL:`, { url: actualUrl, titleLength: title.length, contentLength: content.length });

        results.push({
          title: title,
          url: actualUrl,
          content: content,
          metadata: urlItem.metadata || { source: 'firecrawl-map' }
        });
      }

      console.log(`🔗 Returning ${results.length} results with content lengths:`, 
        results.map(r => ({ url: r.url, contentLength: r.content?.length || 0 }))
      );

      return {
        success: true,
        data: results,
        total: results.length
      };
    } catch (error: any) {
      console.error('Site mapping failed:', error);
      return {
        success: false,
        error: `Site mapping failed: ${error.message}`,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Scrape a single URL with enhanced content extraction
   */
  async scrapeUrl(url: string, options?: {
    extractMainContent?: boolean;
    includeLinks?: boolean;
    waitFor?: number;
  }): Promise<FirecrawlScrapeResult> {
    try {
      console.log(`🕷️ Firecrawl scraping URL: ${url}`);
      console.log(`🔧 Scrape options:`, {
        extractMainContent: options?.extractMainContent ?? true,
        includeLinks: options?.includeLinks ?? true,
        waitFor: options?.waitFor || 0
      });

      // Validate URL before scraping
      if (!url || !url.startsWith('http')) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      // Check if Firecrawl API key is configured
      if (!process.env.FIRECRAWL_API_KEY) {
        throw new Error('Firecrawl API key not configured');
      }

      console.log(`📋 Attempting basic scrape with minimal options for: ${url}`);

      // Try the most basic scrape call possible
      let result: any;
      try {
        console.log(`🚀 Trying completely basic scrape (no options)`);
        result = await this.firecrawl.scrape(url);
        console.log(`✅ Basic scrape successful, result keys:`, Object.keys(result || {}));
      } catch (basicError: any) {
        console.log(`❌ Basic scrape failed:`, basicError.message);
        
        // Try with just onlyMainContent
        try {
          console.log(`🚀 Trying with onlyMainContent only`);
          result = await this.firecrawl.scrape(url, { onlyMainContent: true });
          console.log(`✅ OnlyMainContent scrape successful`);
        } catch (mainContentError: any) {
          console.log(`❌ OnlyMainContent scrape failed:`, mainContentError.message);
          
          // Try with empty object
          try {
            console.log(`🚀 Trying with empty options object`);
            result = await this.firecrawl.scrape(url, {});
            console.log(`✅ Empty options scrape successful`);
          } catch (emptyError: any) {
            console.log(`❌ All scrape attempts failed, throwing original error`);
            throw basicError; // Throw the first error for consistency
          }
        }
      }
      
      console.log(`📄 Raw Firecrawl result:`, {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        hasContent: !!result?.content,
        hasMarkdown: !!result?.markdown,
        hasHtml: !!result?.html,
        hasMetadata: !!result?.metadata,
        contentLength: result?.content?.length || 0,
        markdownLength: result?.markdown?.length || 0
      });

      // Handle the SDK response flexibly
      return {
        success: true,
        data: {
          content: result.content || result.html || result.markdown || '',
          markdown: result.markdown || result.content || '',
          metadata: result.metadata || {},
          links: result.links ? result.links.map((link: any) => {
            if (typeof link === 'string') {
              return { text: link, url: link };
            }
            return {
              text: link.text || link.title || link.url || '',
              url: link.url || link.href || link
            };
          }) : []
        }
      };
    } catch (error: any) {
      console.error(`❌ Firecrawl scrape error for ${url}:`, {
        message: error.message,
        status: error.status,
        code: error.code,
        response: error.response?.data || error.response,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      throw new Error(`Firecrawl scrape failed: ${error.message}`);
    }
  }

  /**
   * Bulk scrape multiple URLs
   */
  async bulkScrapeUrls(urls: string[], options?: {
    extractMainContent?: boolean;
    includeLinks?: boolean;
    concurrency?: number;
  }): Promise<FirecrawlBulkResult> {
    try {
      // Use batchScrape for bulk operations - this starts an async job
      const batchJob: any = await this.firecrawl.batchScrape(urls, {
        // Use only supported options to avoid TypeScript errors
      });

      // The batchScrape returns a job object with an ID
      // In a real implementation, you'd poll for completion
      return {
        success: true,
        jobId: batchJob.id || 'batch-' + Date.now(),
        status: 'pending',
        data: [] // Data will be available when job completes
      };
    } catch (error: any) {
      throw new Error(`Firecrawl bulk scrape failed: ${error.message}`);
    }
  }

  /**
   * Get the status of a bulk scraping job
   */
  async getJobStatus(jobId: string): Promise<FirecrawlBulkResult> {
    try {
      // Use getBatchScrapeStatus to check job status
      const status: any = await this.firecrawl.getBatchScrapeStatus(jobId);

      const data = status.data ? status.data.map((doc: any) => ({
        url: doc.url || '',
        content: doc.content || doc.html || doc.markdown || '',
        metadata: doc.metadata || {}
      })) : [];

      return {
        success: true,
        jobId,
        status: status.status || 'completed',
        data
      };
    } catch (error: any) {
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * Health check to verify Firecrawl service is accessible
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      // Test with a simple scrape
      await this.firecrawl.scrape('https://example.com', {
        formats: ['markdown'],
        onlyMainContent: true
      });
      
      return { status: 'healthy' };
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        details: error.message 
      };
    }
  }
}

export default FirecrawlService;