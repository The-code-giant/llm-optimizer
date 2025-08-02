import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { callLLM } from './llmProviders';

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  documentType: 'page' | 'blog' | 'service' | 'about' | 'contact' | 'testimonial' | 'faq' | 'other';
  metadata: {
    headings: string[];
    links: string[];
    images: string[];
    lastModified?: string;
    wordCount: number;
    [key: string]: any;
  };
}

export interface CrawlResult {
  siteId: string;
  pages: CrawledPage[];
  totalPages: number;
  errors: string[];
  businessIntelligence: {
    brandVoice: any;
    targetAudience: any;
    services: any[];
    contactInfo: any;
    [key: string]: any;
  };
}

export class SiteCrawlerService {
  private readonly maxPages = 50; // Limit to prevent infinite crawling
  private readonly maxDepth = 3; // Maximum depth for crawling
  private readonly timeout = 10000; // 10 seconds timeout
  private readonly userAgent = 'CleverSearch-Bot/1.0';

  /**
   * Crawl a website and extract all relevant content
   */
  async crawlSite(siteId: string, baseUrl: string): Promise<CrawlResult> {
    try {
      console.log(`Starting crawl for site ${siteId} at ${baseUrl}`);
      
      const visitedUrls = new Set<string>();
      const pages: CrawledPage[] = [];
      const errors: string[] = [];
      const queue: { url: string; depth: number }[] = [{ url: baseUrl, depth: 0 }];

      while (queue.length > 0 && pages.length < this.maxPages) {
        const { url, depth } = queue.shift()!;
        
        if (visitedUrls.has(url) || depth > this.maxDepth) {
          continue;
        }

        visitedUrls.add(url);

        try {
          const page = await this.crawlPage(url, depth);
          if (page) {
            pages.push(page);
            
            // Add new URLs to queue if within depth limit
            if (depth < this.maxDepth) {
              const newUrls = this.extractInternalLinks(page.metadata.links, baseUrl);
              for (const newUrl of newUrls) {
                if (!visitedUrls.has(newUrl)) {
                  queue.push({ url: newUrl, depth: depth + 1 });
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error crawling ${url}:`, error);
          errors.push(`Failed to crawl ${url}: ${error}`);
        }
      }

      // Extract business intelligence from all pages
      const businessIntelligence = this.extractBusinessIntelligence(pages);

      console.log(`Completed crawl for site ${siteId}: ${pages.length} pages, ${errors.length} errors`);

      return {
        siteId,
        pages,
        totalPages: pages.length,
        errors,
        businessIntelligence,
      };
    } catch (error) {
      console.error('Error in site crawler:', error);
      throw new Error(`Failed to crawl site ${siteId}: ${error}`);
    }
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string, depth: number): Promise<CrawledPage | null> {
    try {
      console.log(`Crawling page: ${url} (depth: ${depth})`);

      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });

      if (response.status !== 200) {
        console.log(`Skipping ${url}: HTTP ${response.status}`);
        return null;
      }

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, noscript, iframe, nav, footer, header, aside').remove();
      
      const title = $('title').text().trim() || $('h1').first().text().trim();
      const content = this.extractMainContent($);
      const documentType = this.classifyDocumentType(url, title, content);
      const metadata = this.extractMetadata($, url);

      if (!content || content.length < 50) {
        console.log(`Skipping ${url}: insufficient content`);
        return null;
      }

      return {
        url,
        title,
        content,
        documentType,
        metadata,
      };
    } catch (error) {
      console.error(`Error crawling page ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract main content from the page
   */
  private extractMainContent($: cheerio.CheerioAPI): string {
    // Try to find main content area
    let content = '';
    
    // Priority order for content extraction
    const selectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '#content',
      '#main',
      '.container',
      'body',
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) {
          break;
        }
      }
    }

    // Clean up the content
    return this.cleanContent(content);
  }

  /**
   * Clean and normalize content
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize line breaks
      .replace(/[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>-]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Classify document type based on URL and content
   */
  private async classifyDocumentType(url: string, title: string, content: string): Promise<CrawledPage['documentType']> {
    try {
      // Prepare the content for AI analysis (limit to first 2000 characters to avoid token limits)
      const contentPreview = content.substring(0, 2000);
      
      const prompt = `Analyze this webpage and classify it into one of these categories:
- blog: Blog posts, articles, news, tutorials, guides
- service: Service pages, product pages, what we offer
- about: About us, company information, team pages
- contact: Contact information, contact forms, get in touch
- testimonial: Customer reviews, testimonials, case studies
- faq: Frequently asked questions, help pages, support
- page: General pages, landing pages, other content

URL: ${url}
Title: ${title}
Content Preview: ${contentPreview}

Respond with only the category name (blog, service, about, contact, testimonial, faq, or page):`;

      const response = await callLLM({
        prompt,
        maxTokens: 50,
        temperature: 0.1, // Low temperature for consistent classification
        provider: 'openai'
      });

      const classification = response.text.trim().toLowerCase();
      
      // Validate the response is one of our expected types
      const validTypes: CrawledPage['documentType'][] = ['blog', 'service', 'about', 'contact', 'testimonial', 'faq', 'page'];
      
      if (validTypes.includes(classification as CrawledPage['documentType'])) {
        console.log(`AI classified ${url} as: ${classification}`);
        return classification as CrawledPage['documentType'];
      } else {
        console.log(`AI returned invalid classification "${classification}" for ${url}, defaulting to 'page'`);
        return 'page';
      }
    } catch (error) {
      console.error(`Error classifying document type for ${url}:`, error);
      // Fallback to simple URL-based classification if AI fails
      return this.fallbackClassifyDocumentType(url, title, content);
    }
  }

  private fallbackClassifyDocumentType(url: string, title: string, content: string): CrawledPage['documentType'] {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Blog posts
    if (urlLower.includes('/blog/') || urlLower.includes('/blogs/') || urlLower.includes('/post/') || 
        urlLower.includes('/posts/') || urlLower.includes('/article/') || urlLower.includes('/articles/') ||
        titleLower.includes('blog') || contentLower.includes('blog post')) {
      return 'blog';
    }

    // Services
    if (urlLower.includes('/services/') || urlLower.includes('/service/') ||
        contentLower.includes('our services') || contentLower.includes('what we do')) {
      return 'service';
    }

    // About pages
    if (urlLower.includes('/about/') || titleLower.includes('about') ||
        contentLower.includes('about us') || contentLower.includes('our story')) {
      return 'about';
    }

    // Contact pages
    if (urlLower.includes('/contact/') || titleLower.includes('contact') ||
        contentLower.includes('contact us') || contentLower.includes('get in touch')) {
      return 'contact';
    }

    // Testimonials
    if (urlLower.includes('/testimonials/') || urlLower.includes('/reviews/') ||
        urlLower.includes('/testimonial/') || urlLower.includes('/review/') ||
        (contentLower.includes('testimonial') && !contentLower.includes('blog')) ||
        (contentLower.includes('review') && !contentLower.includes('blog'))) {
      return 'testimonial';
    }

    // FAQ pages
    if (urlLower.includes('/faq/') || urlLower.includes('/help/') ||
        titleLower.includes('faq') || contentLower.includes('frequently asked')) {
      return 'faq';
    }

    return 'page';
  }

  /**
   * Extract metadata from the page
   */
  private extractMetadata($: cheerio.CheerioAPI, url: string): CrawledPage['metadata'] {
    const headings: string[] = [];
    const links: string[] = [];
    const images: string[] = [];

    // Extract headings
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        headings.push(text);
      }
    });

    // Extract links
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        links.push(href);
      }
    });

    // Extract images
    $('img[src]').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        images.push(src);
      }
    });

    // Calculate word count
    const wordCount = $('body').text().split(/\s+/).length;

    return {
      headings,
      links,
      images,
      wordCount,
    };
  }

  /**
   * Extract internal links from a list of URLs
   */
  private extractInternalLinks(links: string[], baseUrl: string): string[] {
    const baseUrlObj = new URL(baseUrl);
    const internalLinks: string[] = [];

    for (const link of links) {
      try {
        const linkUrl = new URL(link, baseUrl);
        
        // Check if it's the same domain
        if (linkUrl.hostname === baseUrlObj.hostname) {
          // Filter out unwanted URLs
          if (!this.shouldSkipUrl(linkUrl.href)) {
            internalLinks.push(linkUrl.href);
          }
        }
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }

    return Array.from(new Set(internalLinks)); // Remove duplicates
  }

  /**
   * Check if URL should be skipped
   */
  private shouldSkipUrl(url: string): boolean {
    const skipPatterns = [
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg)$/i,
      /\.(jpg|jpeg|png|gif|svg|ico|webp)$/i,
      /\.(css|js|xml|json|txt|log)$/i,
      /mailto:/,
      /tel:/,
      /javascript:/,
      /#/,
      /admin/,
      /wp-admin/,
      /login/,
      /logout/,
      /cart/,
      /checkout/,
      /account/,
      /dashboard/,
    ];

    return skipPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extract business intelligence from crawled pages
   */
  private extractBusinessIntelligence(pages: CrawledPage[]): CrawlResult['businessIntelligence'] {
    const allContent = pages.map(p => p.content).join(' ');
    const allTitles = pages.map(p => p.title).join(' ');
    const contactPages = pages.filter(p => p.documentType === 'contact');
    const servicePages = pages.filter(p => p.documentType === 'service');
    const aboutPages = pages.filter(p => p.documentType === 'about');

    return {
      brandVoice: this.extractBrandVoice(allContent, allTitles),
      targetAudience: this.extractTargetAudience(allContent),
      services: this.extractServices(servicePages),
      contactInfo: this.extractContactInfo(contactPages),
    };
  }

  /**
   * Extract brand voice information
   */
  private extractBrandVoice(content: string, titles: string): any {
    const contentLower = content.toLowerCase();
    const titlesLower = titles.toLowerCase();

    // Analyze tone and style
    const formalWords = ['professional', 'expert', 'quality', 'reliable', 'trusted'];
    const casualWords = ['friendly', 'approachable', 'easy', 'simple', 'fun'];
    const technicalWords = ['technology', 'innovation', 'solution', 'platform', 'system'];

    const tone = {
      formal: formalWords.filter(word => contentLower.includes(word)).length,
      casual: casualWords.filter(word => contentLower.includes(word)).length,
      technical: technicalWords.filter(word => contentLower.includes(word)).length,
    };

    return {
      tone,
      primaryKeywords: this.extractKeywords(content, 10),
      companyName: this.extractCompanyName(titles),
    };
  }

  /**
   * Extract target audience information
   */
  private extractTargetAudience(content: string): any {
    const contentLower = content.toLowerCase();
    
    const audienceIndicators = {
      b2b: ['business', 'enterprise', 'corporate', 'professional', 'industry'],
      b2c: ['customer', 'consumer', 'personal', 'individual', 'family'],
      technical: ['developer', 'engineer', 'technical', 'programmer', 'IT'],
      nonTechnical: ['simple', 'easy', 'user-friendly', 'intuitive', 'straightforward'],
    };

    const audience: Record<string, number> = {};
    for (const [type, keywords] of Object.entries(audienceIndicators)) {
      audience[type] = keywords.filter(word => contentLower.includes(word)).length;
    }

    return audience;
  }

  /**
   * Extract services information
   */
  private extractServices(servicePages: CrawledPage[]): any[] {
    const services: any[] = [];

    for (const page of servicePages) {
      const service = {
        title: page.title,
        description: page.content.substring(0, 200),
        url: page.url,
      };
      services.push(service);
    }

    return services;
  }

  /**
   * Extract contact information
   */
  private extractContactInfo(contactPages: CrawledPage[]): any {
    if (contactPages.length === 0) return {};

    const contactContent = contactPages[0].content;
    
    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = contactContent.match(emailRegex) || [];

    // Extract phone numbers
    const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = contactContent.match(phoneRegex) || [];

    return {
      emails: Array.from(new Set(emails)),
      phones: Array.from(new Set(phones)),
      address: this.extractAddress(contactContent),
    };
  }

  /**
   * Extract address information
   */
  private extractAddress(content: string): string {
    // Simple address extraction - could be enhanced with NLP
    const addressPatterns = [
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Terrace|Ter)/gi,
      /\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/gi,
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
   * Extract company name from titles
   */
  private extractCompanyName(titles: string): string {
    // Simple company name extraction
    const titleWords = titles.split(/\s+/);
    const commonWords = ['home', 'welcome', 'about', 'contact', 'services', 'blog'];
    
    for (const word of titleWords) {
      if (word.length > 2 && !commonWords.includes(word.toLowerCase())) {
        return word;
      }
    }

    return '';
  }
}

// Export singleton instance
export const siteCrawlerService = new SiteCrawlerService(); 