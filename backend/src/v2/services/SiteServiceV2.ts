import { db } from '../../db/client';
import { sites, pages, contentAnalysis } from '../../db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { FirecrawlService } from './FirecrawlService';
import { AnalysisService } from '../../utils/analysisService';
import { EnhancedRatingService } from '../../utils/enhancedRatingService';
import { ScoreUpdateService } from '../../services/scoreUpdateService';

export interface SiteCreationOptions {
  autoCrawl?: boolean;
  maxPages?: number;
  crawlDepth?: number;
}

export interface SiteCreationResult {
  site: {
    id: string;
    name: string;
    url: string;
    trackerId: string;
    status: string;
    createdAt: Date;
  };
  crawlingStatus: {
    enabled: boolean;
    pagesDiscovered: number;
    pagesAnalyzed: number;
    errors: string[];
  };
}

/**
 * Enhanced Site Service using Firecrawl for automatic page discovery and content extraction
 */
export class SiteServiceV2 {
  private firecrawlService: FirecrawlService;

  constructor() {
    this.firecrawlService = FirecrawlService.getInstance();
  }

  /**
   * Create a new site with automatic Firecrawl-powered page discovery
   */
  async createSiteWithCrawling(
    userId: string,
    name: string,
    url: string,
    options: SiteCreationOptions = {}
  ): Promise<SiteCreationResult> {
    const {
      autoCrawl = true,
      maxPages = 10,
      crawlDepth = 2
    } = options;

    // Validate URL format
    let normalizedUrl: string;
    try {
      const urlObj = new URL(url);
      normalizedUrl = urlObj.origin; // Use origin for consistency
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    // Check if site already exists
    const existingSite = await db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.url, normalizedUrl),
          eq(sites.userId, userId),
          isNull(sites.deletedAt)
        )
      )
      .limit(1);

    if (existingSite.length > 0) {
      throw new Error('Site with this URL already exists');
    }

    // Create the site
    const trackerId = randomUUID();
    const newSites = await db
      .insert(sites)
      .values({
        userId,
        name,
        url: normalizedUrl,
        trackerId,
        status: autoCrawl ? 'discovering' : 'active',
        settings: {
          firecrawlEnabled: true,
          maxPagesPerCrawl: maxPages,
          autoCrawl
        },
        totalPages: 0,
        pagesWithScores: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    const site = newSites[0];

    // Initialize crawling status
    const crawlingStatus = {
      enabled: autoCrawl,
      pagesDiscovered: 0,
      pagesAnalyzed: 0,
      errors: [] as string[]
    };

    // If auto-crawl is enabled, discover and crawl pages
    if (autoCrawl) {
      try {
        const crawlResults = await this.discoverAndCrawlPages(site.id, normalizedUrl, maxPages);
        crawlingStatus.pagesDiscovered = crawlResults.pagesDiscovered;
        crawlingStatus.pagesAnalyzed = crawlResults.pagesAnalyzed;
        crawlingStatus.errors = crawlResults.errors;

        // Update site status to active after crawling
        await db
          .update(sites)
          .set({
            status: 'active',
            totalPages: crawlResults.pagesDiscovered,
            lastMetricsUpdate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(sites.id, site.id));
        
        // Update the returned site object
        site.status = 'active';
        site.totalPages = crawlResults.pagesDiscovered;

      } catch (error: any) {
        console.error('Site crawling failed:', error);
        crawlingStatus.errors.push(error.message);

        // Update site status to active even if crawling fails
        await db
          .update(sites)
          .set({
            status: 'active',
            updatedAt: new Date()
          })
          .where(eq(sites.id, site.id));
        
        site.status = 'active';
      }
    }

    return {
      site: {
        id: site.id,
        name: site.name,
        url: site.url,
        trackerId: site.trackerId,
        status: site.status,
        createdAt: site.createdAt!
      },
      crawlingStatus
    };
  }

  /**
   * Discover and crawl pages for a site using Firecrawl
   */
  private async discoverAndCrawlPages(
    siteId: string,
    siteUrl: string,
    maxPages: number = 10
  ): Promise<{
    pagesDiscovered: number;
    pagesAnalyzed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let pagesDiscovered = 0;
    let pagesAnalyzed = 0;

    console.log(`🚀 Starting page discovery for site: ${siteId} (${siteUrl})`);
    console.log(`📊 Max pages to discover: ${maxPages}`);
    
    // Test database connection
    try {
      await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
      console.log(`✅ Database connection verified for site: ${siteId}`);
    } catch (dbError: any) {
      console.error(`❌ Database connection failed:`, dbError);
      errors.push(`Database connection failed: ${dbError.message}`);
      return { pagesDiscovered: 0, pagesAnalyzed: 0, errors };
    }

    try {
      // Step 1: Use Firecrawl to map the site and discover URLs
      console.log(`Discovering pages for site: ${siteUrl}`);
      
      // Simple site mapping instead of competitor search
      console.log(`🗺️ Using direct site mapping for: ${siteUrl}`);
      
      // Try to map the site directly to find internal pages
      const mapResult = await this.firecrawlService.mapSite(siteUrl, {
        maxPages: maxPages
      });

      if (!mapResult.success) {
        throw new Error(mapResult.error || 'Site mapping failed');
      }

      console.log(`Found ${mapResult.data.length} pages to process`);

      // Step 2a: Always ensure the main URL is included as the first page
      const mainUrlPage = {
        url: siteUrl,
        title: 'Homepage',
        content: '',
        metadata: { isMainUrl: true }
      };

      // Filter out unwanted URLs (robots.txt, XML files, etc.)
      const filteredPages = mapResult.data.filter((page) => {
        const url = page.url.toLowerCase();
        
        // Skip robots.txt, XML files, admin pages, and other unwanted URLs
        const unwantedPatterns = [
          'robots.txt',
          'sitemap',
          '.xml',
          '.rss',
          '/feed',
          '/feeds',
          'wp-admin',
          'wp-content',
          'wp-json',
          'wp-login',
          '/admin',
          '/api/',
          '/.well-known',
          '/manifest.json',
          'favicon.ico',
          '.pdf',
          '.doc',
          '.zip',
          '.jpg',
          '.png',
          '.gif',
          '.css',
          '.js',
          '#'
        ];
        
        const shouldSkip = unwantedPatterns.some(pattern => url.includes(pattern));
        
        if (shouldSkip) {
          console.log(`🚫 Skipping unwanted URL: ${page.url}`);
          return false;
        }
        
        return true;
      });

      // Combine main URL + filtered discovered pages, avoiding duplicates
      const allPages: any[] = [mainUrlPage];
      for (const page of filteredPages) {
        if (page.url !== siteUrl && !allPages.find(p => p.url === page.url)) {
          allPages.push({
            url: page.url,
            title: page.title || '',
            content: page.content || '',
            metadata: { ...page.metadata, isMainUrl: false }
          });
        }
      }

      const pagesToProcess = allPages.slice(0, maxPages);
      console.log(`📋 Processing ${pagesToProcess.length} pages (including main URL):`, 
        pagesToProcess.map(p => ({ url: p.url, isMain: p.metadata?.isMainUrl || false }))
      );

      // Step 2b: Process each page (starting with main URL)
      for (const result of pagesToProcess) {
        try {
          const isMainUrl = result.metadata?.isMainUrl || false;
          console.log(`🔄 Processing page: ${result.url} ${isMainUrl ? '(MAIN URL)' : ''}`);
          
          // Check if page already exists
          const existingPage = await db
            .select()
            .from(pages)
            .where(
              and(
                eq(pages.siteId, siteId),
                eq(pages.url, result.url)
              )
            )
            .limit(1);

          if (existingPage.length === 0) {
            console.log(`📄 New page found: ${result.url} ${isMainUrl ? '(Homepage)' : ''}`);
            
            // Step 3: Always scrape content for this page (don't rely on mapping content)
            let enhancedContent = '';
            let pageTitle = result.title || (isMainUrl ? 'Homepage' : '');

            console.log(`🔍 Initial data from mapping:`, {
              url: result.url,
              isMainUrl,
              titleFromMap: result.title || 'No title',
              contentFromMap: result.content?.length || 0,
              hasMapContent: !!result.content
            });

            // ALWAYS scrape the page for fresh content (mapping content is often empty)
            try {
              console.log(`🕷️ Performing fresh scrape for content: ${result.url}`);
              
              // Temporary: Skip Firecrawl for now and use fallback content
              if (process.env.SKIP_FIRECRAWL === 'true') {
                console.log(`⏭️ Skipping Firecrawl (SKIP_FIRECRAWL=true), using fallback content`);
                throw new Error('Firecrawl temporarily disabled via SKIP_FIRECRAWL environment variable');
              }
              
              const scrapeResult = await this.firecrawlService.scrapeUrl(result.url, {
                extractMainContent: true,
                includeLinks: false
              });

              console.log(`📄 Scrape result details:`, {
                success: scrapeResult.success,
                hasData: !!scrapeResult.data,
                hasMarkdown: !!scrapeResult.data?.markdown,
                hasContent: !!scrapeResult.data?.content,
                markdownLength: scrapeResult.data?.markdown?.length || 0,
                contentLength: scrapeResult.data?.content?.length || 0,
                hasMetadata: !!scrapeResult.data?.metadata,
                metadataTitle: scrapeResult.data?.metadata?.title || 'No title'
              });

              if (scrapeResult.success && scrapeResult.data) {
                // Create comprehensive content object with all crawled data
                const fullContentData = {
                  url: result.url,
                  crawledAt: new Date().toISOString(),
                  source: 'firecrawl',
                  isMainUrl: isMainUrl,
                  // Raw scraped content
                  content: scrapeResult.data.content || '',
                  markdown: scrapeResult.data.markdown || '',
                  // Metadata from scraping
                  metadata: {
                    title: scrapeResult.data.metadata?.title || '',
                    description: scrapeResult.data.metadata?.description || '',
                    keywords: scrapeResult.data.metadata?.keywords || '',
                    ogTitle: scrapeResult.data.metadata?.og_title || '',
                    ogDescription: scrapeResult.data.metadata?.og_description || '',
                    ogImage: scrapeResult.data.metadata?.og_image || '',
                    canonical: scrapeResult.data.metadata?.canonical || '',
                    robots: scrapeResult.data.metadata?.robots || '',
                    viewport: scrapeResult.data.metadata?.viewport || '',
                    ...scrapeResult.data.metadata
                  },
                  // Links found on the page
                  links: scrapeResult.data.links || [],
                  // Technical details
                  crawlInfo: {
                    contentLength: scrapeResult.data.content?.length || 0,
                    markdownLength: scrapeResult.data.markdown?.length || 0,
                    linksCount: scrapeResult.data.links?.length || 0,
                    hasContent: !!scrapeResult.data.content,
                    hasMarkdown: !!scrapeResult.data.markdown,
                    hasMetadata: !!scrapeResult.data.metadata
                  }
                };

                // Save the complete data as JSON in contentSnapshot
                enhancedContent = JSON.stringify(fullContentData, null, 2);
                
                // Use the best available content for display title
                pageTitle = scrapeResult.data.metadata?.title || 
                           scrapeResult.data.metadata?.og_title ||
                           result.title || (isMainUrl ? 'Homepage' : 'Untitled Page');

                console.log(`✅ Full content data saved:`, {
                  finalContentLength: enhancedContent.length,
                  finalTitle: pageTitle,
                  dataStructure: {
                    hasRawContent: !!fullContentData.content,
                    hasMarkdown: !!fullContentData.markdown,
                    hasMetadata: !!fullContentData.metadata,
                    linksCount: fullContentData.links.length,
                    metadataKeys: Object.keys(fullContentData.metadata)
                  }
                });
                
                pagesAnalyzed++;
              } else {
                console.warn(`❌ Scrape failed for ${result.url}: No valid data returned`);
                enhancedContent = result.content || `Basic content for ${result.url} - scraped on ${new Date().toISOString()}`;
                errors.push(`Scraping failed for ${result.url}: No valid data returned`);
              }
            } catch (scrapeError: any) {
              console.error(`❌ Scrape error for ${result.url}:`, scrapeError.message);
              
              // Fallback: create basic content so we don't lose the page
              enhancedContent = `Content not available via Firecrawl for ${result.url}. ` +
                              `Error: ${scrapeError.message}. ` +
                              `Page added on ${new Date().toISOString()}. ` +
                              `Manual content update may be required.`;
              
              pageTitle = pageTitle || `Page: ${new URL(result.url).pathname}` || 'Unknown Page';
              
              errors.push(`Scraping failed for ${result.url}: ${scrapeError.message}`);
              console.log(`🔄 Using fallback content for ${result.url}`);
            }

            // Ensure we always have SOME content
            if (!enhancedContent || enhancedContent.trim().length === 0) {
              enhancedContent = `Page content not available for ${result.url}. Scraped on ${new Date().toISOString()}.`;
              console.warn(`⚠️ No content available, using fallback message for: ${result.url}`);
            }

            console.log(`📊 Final content to save:`, {
              url: result.url,
              title: pageTitle,
              contentLength: enhancedContent.length,
              contentPreview: enhancedContent.substring(0, 200) + '...',
              willSaveContent: true
            });

            // Step 4: Create the page in database
            console.log(`💾 Saving page to database: ${result.url}`);
            console.log(`📝 Page data being saved:`, {
              siteId,
              url: result.url,
              title: pageTitle || 'No title',
              contentLength: enhancedContent?.length || 0,
              hasContent: !!enhancedContent,
              contentPreview: enhancedContent?.substring(0, 100) + '...' || 'No content'
            });

            const newPages = await db
              .insert(pages)
              .values({
                siteId,
                url: result.url,
                title: pageTitle || null,
                contentSnapshot: enhancedContent || null,
                lastScannedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();

            const newPage = newPages[0];
            console.log(`✅ Page saved successfully:`, {
              pageId: newPage.id,
              savedTitle: newPage.title,
              savedContentLength: newPage.contentSnapshot?.length || 0,
              hasContentSnapshot: !!newPage.contentSnapshot
            });

            // Verify the content was actually saved by reading it back
            try {
              const verifyPage = await db
                .select({
                  id: pages.id,
                  url: pages.url,
                  title: pages.title,
                  contentSnapshot: pages.contentSnapshot
                })
                .from(pages)
                .where(eq(pages.id, newPage.id))
                .limit(1);

              if (verifyPage.length > 0) {
                console.log(`🔍 Database verification:`, {
                  pageId: verifyPage[0].id,
                  savedUrl: verifyPage[0].url,
                  savedTitle: verifyPage[0].title,
                  contentSnapshotLength: verifyPage[0].contentSnapshot?.length || 0,
                  hasContentInDB: !!verifyPage[0].contentSnapshot,
                  contentPreview: verifyPage[0].contentSnapshot?.substring(0, 100) || 'No content'
                });
              } else {
                console.error(`❌ Could not verify page save for ID: ${newPage.id}`);
              }
            } catch (verifyError: any) {
              console.error(`❌ Database verification failed:`, verifyError.message);
            }

            // Step 5: Run AI analysis only on the main URL using stored JSON content
            if (isMainUrl) {
              try {
                console.log(`🧠 Running AI analysis for MAIN URL only: ${result.url}`);
                
                // Parse the stored JSON content for analysis
                let analysisContent = enhancedContent;
                try {
                  const parsedContent = JSON.parse(enhancedContent || '{}');
                  // Use markdown content if available, fallback to raw content
                  analysisContent = parsedContent.markdown || parsedContent.content || enhancedContent;
                  
                  console.log(`📄 Using parsed content for analysis:`, {
                    hasMarkdown: !!parsedContent.markdown,
                    hasContent: !!parsedContent.content,
                    hasMetadata: !!parsedContent.metadata,
                    contentLength: analysisContent?.length || 0
                  });
                } catch (parseError) {
                  console.log(`📄 Using raw content for analysis (JSON parse failed):`, {
                    contentLength: analysisContent?.length || 0
                  });
                }
                
                const analysisResult = await AnalysisService.analyzePage({ 
                  url: result.url
                });
                
                console.log(`📊 Analysis result received:`, {
                  score: analysisResult.score,
                  hasContent: !!analysisResult.content,
                  hasSummary: !!analysisResult.pageSummary,
                  contentQuality: analysisResult.contentQuality,
                  technicalSEO: analysisResult.technicalSEO
                });
              
              console.log(`📊 Analysis result received:`, {
                score: analysisResult.score,
                hasContent: !!analysisResult.content,
                hasSummary: !!analysisResult.pageSummary,
                contentQuality: analysisResult.contentQuality,
                technicalSEO: analysisResult.technicalSEO
              });

              // Store the analysis result
              console.log(`💾 Saving analysis to database for page: ${newPage.id}`);
              const analysisInsert = await db
                .insert(contentAnalysis)
                .values({
                  pageId: newPage.id,
                  overallScore: analysisResult.score,
                  llmModelUsed: 'gpt-4o-mini',
                  pageSummary: analysisResult.pageSummary,
                  analysisSummary: analysisResult.summary,
                  // Content quality metrics (0-100 scale)
                  contentClarity: analysisResult.contentQuality.clarity * 10,
                  contentStructure: analysisResult.contentQuality.structure * 10,
                  contentCompleteness: analysisResult.contentQuality.completeness * 10,
                  // Technical SEO metrics (0-100 scale)
                  titleOptimization: analysisResult.technicalSEO.titleOptimization * 10,
                  metaDescription: analysisResult.technicalSEO.metaDescription * 10,
                  headingStructure: analysisResult.technicalSEO.headingStructure * 10,
                  schemaMarkup: analysisResult.technicalSEO.schemaMarkup * 10,
                  // Keyword analysis
                  primaryKeywords: analysisResult.keywordAnalysis.primaryKeywords,
                  longTailKeywords: analysisResult.keywordAnalysis.longTailKeywords,
                  keywordDensity: analysisResult.keywordAnalysis.keywordDensity,
                  semanticKeywords: analysisResult.keywordAnalysis.semanticKeywords,
                  // LLM optimization metrics
                  definitionsPresent: analysisResult.llmOptimization.definitionsPresent ? 1 : 0,
                  faqsPresent: analysisResult.llmOptimization.faqsPresent ? 1 : 0,
                  structuredData: analysisResult.llmOptimization.structuredData ? 1 : 0,
                  citationFriendly: analysisResult.llmOptimization.citationFriendly ? 1 : 0,
                  topicCoverage: analysisResult.llmOptimization.topicCoverage,
                  answerableQuestions: analysisResult.llmOptimization.answerableQuestions,
                  confidence: 0.85, // Default confidence score
                  analysisVersion: '2.0',
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
                .returning();

              console.log(`✅ Analysis saved with ID: ${analysisInsert[0]?.id}`);

              // Calculate section-based score if section ratings are available (same as V1)
              let finalScore = analysisResult.score;
              if (analysisResult.sectionRatings) {
                const sectionBasedScore = EnhancedRatingService.calculateTotalScore(analysisResult.sectionRatings);
                console.log(`📊 Section-based score: ${sectionBasedScore}% (from 7 sections), AI analysis score: ${analysisResult.score}%`);
                finalScore = sectionBasedScore;

                // Save section ratings to database (same as V1)
                console.log(`💾 Saving section ratings to database...`);
                await EnhancedRatingService.saveSectionRatings(
                  newPage.id, 
                  analysisInsert[0]?.id, 
                  analysisResult.sectionRatings
                );
                console.log(`✅ Section ratings saved successfully`);
              }

              // Update the page with analysis results (same as V1)
              console.log(`🔄 Updating page with analysis results and scores...`);
              await db.update(pages)
                .set({ 
                  contentSnapshot: JSON.stringify(analysisResult.content),
                  title: analysisResult.content.title || newPage.title,
                  llmReadinessScore: finalScore,
                  pageScore: finalScore,
                  lastScoreUpdate: new Date(),
                  lastAnalysisAt: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(pages.id, newPage.id));

              console.log(`✅ Page updated with final score: ${finalScore}`);

              // Update site metrics (same as V1)
              console.log(`🔄 Updating site metrics after page analysis...`);
              await ScoreUpdateService.updateSiteMetrics(siteId);
              console.log(`✅ Site metrics updated successfully`);

              // Generate AI recommendations (same as V1 process)
              console.log('🚀 Starting AI recommendation generation...');
              try {
                console.log('🤖 Starting AI recommendation generation...');
                console.log('📄 Page content for AI analysis:', {
                  url: analysisResult.content.url,
                  title: analysisResult.content.title,
                  titleLength: analysisResult.content.title?.length || 0,
                  metaDescription: analysisResult.content.metaDescription?.substring(0, 100) + '...',
                  metaLength: analysisResult.content.metaDescription?.length || 0,
                  contentLength: analysisResult.content.bodyText?.length || 0,
                  headings: analysisResult.content.headings?.length || 0,
                  keywords: analysisResult.keywordAnalysis?.primaryKeywords || []
                });
                
                console.log('🔧 Calling AnalysisService.generateAIRecommendations...');
                const aiRecommendations = await AnalysisService.generateAIRecommendations(
                  analysisResult.content,
                  analysisResult,
                  analysisResult.pageSummary || ''
                );

                console.log('💾 Saving AI recommendations to database...');
                // Save AI recommendations to database
                await AnalysisService.saveAIRecommendations(newPage.id, analysisInsert[0]?.id, aiRecommendations);
                console.log(`🤖 Generated and saved AI recommendations for page ${newPage.id}`);
                console.log('✅ AI recommendations saved successfully');
              } catch (aiError: any) {
                console.error('❌ AI recommendation generation failed:', aiError);
                console.error('❌ Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
                errors.push(`AI recommendation generation failed for ${result.url}: ${aiError.message}`);
                // Don't fail the analysis if AI recommendations fail
              }

              console.log(`✅ Complete analysis with recommendations completed for: ${result.url} (Score: ${finalScore}/100)`);
              pagesAnalyzed++;
              
            } catch (analysisError: any) {
              console.warn(`⚠️  Analysis failed for ${result.url}: ${analysisError.message}`);
              errors.push(`Analysis failed for ${result.url}: ${analysisError.message}`);
            }
            } else {
              console.log(`⏭️  Skipping analysis for non-main URL: ${result.url} (analysis only runs for main site URL)`);
            }

            pagesDiscovered++;
            console.log(`✅ Added page with analysis: ${result.url}`);

          } else {
            console.log(`Page already exists: ${result.url}`);
          }

        } catch (pageError: any) {
          console.error(`Failed to process page ${result.url}:`, pageError);
          errors.push(`Failed to process ${result.url}: ${pageError.message}`);
        }
      }

    } catch (error: any) {
      console.error('Page discovery failed:', error);
      errors.push(`Discovery failed: ${error.message}`);
    }

    return {
      pagesDiscovered,
      pagesAnalyzed,
      errors
    };
  }

  /**
   * Get site with enhanced metrics
   */
  async getSiteWithMetrics(userId: string, siteId: string) {
    const siteResult = await db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.id, siteId),
          eq(sites.userId, userId),
          isNull(sites.deletedAt)
        )
      )
      .limit(1);

    if (siteResult.length === 0) {
      throw new Error('Site not found or not authorized');
    }

    const site = siteResult[0];

    // Get page count
    const pageCountResult = await db
      .select({ count: pages.id })
      .from(pages)
      .where(eq(pages.siteId, siteId));

    const pageCount = pageCountResult.length;

    return {
      ...site,
      totalPages: pageCount,
      firecrawlEnabled: site.settings && (site.settings as any).firecrawlEnabled || false
    };
  }

  /**
   * Manually trigger page discovery for existing site
   */
  async rediscoverSitePages(
    userId: string,
    siteId: string,
    maxPages: number = 10
  ): Promise<{
    pagesDiscovered: number;
    pagesAnalyzed: number;
    errors: string[];
  }> {
    // Verify site ownership
    const site = await this.getSiteWithMetrics(userId, siteId);
    
    // Update site status to discovering
    await db
      .update(sites)
      .set({
        status: 'discovering',
        updatedAt: new Date()
      })
      .where(eq(sites.id, siteId));

    try {
      const results = await this.discoverAndCrawlPages(siteId, site.url, maxPages);

      // Update site status back to active
      await db
        .update(sites)
        .set({
          status: 'active',
          totalPages: site.totalPages! + results.pagesDiscovered,
          lastMetricsUpdate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(sites.id, siteId));

      return results;

    } catch (error: any) {
      // Revert status on error
      await db
        .update(sites)
        .set({
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(sites.id, siteId));

      throw error;
    }
  }

  /**
   * Health check for Firecrawl service
   */
  async checkFirecrawlHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    return await this.firecrawlService.healthCheck();
  }
}

export default SiteServiceV2;