import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  private readonly maxDepth = 1; // Maximum depth for crawling
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

      console.log(`Completed crawl for site ${siteId}: ${pages.length} pages, ${errors.length} errors`);

      return {
        siteId,
        pages,
        totalPages: pages.length,
        errors,
        businessIntelligence: {
          brandVoice: {},
          targetAudience: {},
          services: [],
          contactInfo: {}
        }, // Business intelligence will be generated in knowledge base manager
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
      const documentType = await this.classifyDocumentType(url, title, content);
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
  public async classifyDocumentType(url: string, title: string, content: string): Promise<CrawledPage['documentType']> {
    try {
      // Prepare the content for AI analysis (limit to first 2000 characters to avoid token limits)
      const contentPreview = content.substring(0, 2000);
      
      const prompt = `Analyze this webpage and classify it into one of these categories:
- blog: Blog posts, articles, news, tutorials, guides
- service: Service pages, product pages, what we offer, features, solutions
- about: About us, company information, team pages, our story
- contact: Contact information, contact forms, get in touch
- testimonial: Customer reviews, testimonials, case studies
- faq: Frequently asked questions, help pages, support
- page: General pages, landing pages, other content

IMPORTANT: Avoid classifying signup, login, auth, admin, or account pages as services.

URL: ${url}
Title: ${title}
Content Preview: ${contentPreview}

Respond with only the category name (blog, service, about, contact, testimonial, faq, or page):`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at classifying web pages into content categories. Respond with only the category name.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
      });

      const classification = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'page';
      
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

    // Skip auth/admin pages
    const skipPatterns = [
      '/signup', '/login', '/register', '/auth', '/admin', '/dashboard',
      '/cart', '/checkout', '/account', '/profile', '/settings'
    ];
    
    if (skipPatterns.some(pattern => urlLower.includes(pattern))) {
      return 'page';
    }

    // Blog posts
    if (urlLower.includes('/blog/') || urlLower.includes('/blogs/') || urlLower.includes('/post/') || 
        urlLower.includes('/posts/') || urlLower.includes('/article/') || urlLower.includes('/articles/') ||
        titleLower.includes('blog') || contentLower.includes('blog post')) {
      return 'blog';
    }

    // Services
    if (urlLower.includes('/services/') || urlLower.includes('/service/') ||
        urlLower.includes('/features/') || urlLower.includes('/solutions/') ||
        contentLower.includes('our services') || contentLower.includes('what we do') ||
        contentLower.includes('features') || contentLower.includes('solutions')) {
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
}

// Export singleton instance
export const siteCrawlerService = new SiteCrawlerService(); 