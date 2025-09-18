import { FirecrawlService, FirecrawlSearchResult } from './FirecrawlService';
import { AnalysisServiceV2 } from './AnalysisServiceV2';

export interface CompetitorAnalysis {
  url: string;
  title: string;
  domain: string;
  analysis: {
    overallScore: number;
    contentQuality: {
      clarity: number;
      structure: number;
      completeness: number;
    };
    technicalSeo: {
      titleOptimization: number;
      metaDescription: number;
      headingStructure: number;
      schemaMarkup: number;
    };
    keywords: {
      primary: string[];
      longTail: string[];
      density: number;
    };
  };
  metadata: Record<string, any>;
  competitiveInsights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  extractedAt: Date;
}

export interface CompetitiveIntelligenceReport {
  query: string;
  totalCompetitors: number;
  analyzedCompetitors: number;
  competitorAnalyses: CompetitorAnalysis[];
  marketInsights: {
    averageScore: number;
    commonKeywords: string[];
    technicalTrends: {
      schemaUsage: number;
      titleOptimization: number;
      contentQuality: number;
    };
    contentGaps: string[];
    recommendations: string[];
  };
  generatedAt: Date;
}

export class CompetitiveIntelligenceService {
  private firecrawlService: FirecrawlService;
  private analysisService: AnalysisServiceV2;

  constructor() {
    this.firecrawlService = FirecrawlService.getInstance();
    this.analysisService = new AnalysisServiceV2(this.firecrawlService);
  }

  /**
   * Perform competitive intelligence analysis
   */
  async analyzeCompetitors(
    query: string,
    options: {
      maxCompetitors?: number;
      includeDomains?: string[];
      excludeDomains?: string[];
      language?: string;
      location?: string;
    } = {}
  ): Promise<CompetitiveIntelligenceReport> {
    try {
      const {
        maxCompetitors = 10,
        includeDomains = [],
        excludeDomains = [],
        language = 'en',
        location = 'US'
      } = options;

      // Search for competitors using Firecrawl
      const searchResults = await this.firecrawlService.searchCompetitors(query, {
        limit: Math.min(maxCompetitors * 2, 20), // Get extra results for filtering
        language,
        location
      });

      if (!searchResults.success) {
        throw new Error(`Competitor search failed: ${searchResults.error}`);
      }

      // Filter and prioritize results
      const filteredResults = this.filterCompetitorResults(
        searchResults.data,
        includeDomains,
        excludeDomains,
        maxCompetitors
      );

      // Analyze each competitor
      const competitorAnalyses: CompetitorAnalysis[] = [];
      for (const result of filteredResults) {
        try {
          const analysis = await this.analyzeCompetitor(result);
          competitorAnalyses.push(analysis);
        } catch (error: any) {
          console.warn(`Failed to analyze competitor ${result.url}:`, error.message);
        }
      }

      // Generate market insights
      const marketInsights = this.generateMarketInsights(competitorAnalyses);

      return {
        query,
        totalCompetitors: searchResults.data.length,
        analyzedCompetitors: competitorAnalyses.length,
        competitorAnalyses,
        marketInsights,
        generatedAt: new Date()
      };

    } catch (error: any) {
      throw new Error(`Competitive intelligence analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze a single competitor
   */
  async analyzeCompetitor(competitorData: FirecrawlSearchResult): Promise<CompetitorAnalysis> {
    try {
      // Extract detailed content
      const scrapeResult = await this.firecrawlService.scrapeUrl(competitorData.url, {
        extractMainContent: true,
        includeLinks: true
      });

      if (!scrapeResult.success || !scrapeResult.data) {
        throw new Error(`Failed to scrape competitor: ${scrapeResult.error}`);
      }

      // Perform enhanced analysis
      const analysis = await this.analysisService.analyzePageEnhanced(competitorData.url);

      // Generate competitive insights
      const competitiveInsights = this.generateCompetitiveInsights(analysis, scrapeResult.data);

      return {
        url: competitorData.url,
        title: competitorData.title,
        domain: new URL(competitorData.url).hostname,
        analysis: {
          overallScore: analysis.overallScore,
          contentQuality: analysis.contentQuality,
          technicalSeo: analysis.technicalSeo,
          keywords: {
            primary: analysis.keywords.primary,
            longTail: analysis.keywords.longTail,
            density: analysis.keywords.density
          }
        },
        metadata: scrapeResult.data.metadata,
        competitiveInsights,
        extractedAt: new Date()
      };

    } catch (error: any) {
      throw new Error(`Competitor analysis failed for ${competitorData.url}: ${error.message}`);
    }
  }

  /**
   * Generate competitive insights for a single competitor
   */
  private generateCompetitiveInsights(analysis: any, scrapedData: any): CompetitorAnalysis['competitiveInsights'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];

    // Analyze strengths
    if (analysis.overallScore >= 80) {
      strengths.push('High overall SEO score');
    }
    if (analysis.contentQuality.clarity >= 80) {
      strengths.push('Clear and readable content');
    }
    if (analysis.contentQuality.structure >= 80) {
      strengths.push('Well-structured content organization');
    }
    if (analysis.technicalSeo.schemaMarkup >= 80) {
      strengths.push('Comprehensive schema markup implementation');
    }
    if (analysis.llmOptimization.definitionsPresent) {
      strengths.push('Includes clear definitions for key terms');
    }
    if (analysis.llmOptimization.faqsPresent) {
      strengths.push('Contains FAQ section for common queries');
    }

    // Analyze weaknesses
    if (analysis.contentQuality.completeness < 70) {
      weaknesses.push('Content lacks depth and completeness');
    }
    if (analysis.technicalSeo.titleOptimization < 70) {
      weaknesses.push('Page title optimization needs improvement');
    }
    if (analysis.technicalSeo.metaDescription < 70) {
      weaknesses.push('Meta description missing or poorly optimized');
    }
    if (analysis.keywords.density < 2) {
      weaknesses.push('Low keyword density - may miss target topics');
    }
    if (!analysis.llmOptimization.citationFriendly) {
      weaknesses.push('Lacks citations and authoritative references');
    }

    // Identify opportunities
    if (analysis.llmOptimization.topicCoverage < 70) {
      opportunities.push('Expand topic coverage for broader relevance');
    }
    if (analysis.llmOptimization.answerableQuestions < 50) {
      opportunities.push('Add more direct answers to common questions');
    }
    if (analysis.technicalSeo.headingStructure < 80) {
      opportunities.push('Improve heading structure for better content hierarchy');
    }
    if (analysis.keywords.longTail.length < 5) {
      opportunities.push('Target more long-tail keywords for specific queries');
    }

    return {
      strengths,
      weaknesses,
      opportunities
    };
  }

  /**
   * Generate market insights from all competitor analyses
   */
  private generateMarketInsights(analyses: CompetitorAnalysis[]): CompetitiveIntelligenceReport['marketInsights'] {
    if (analyses.length === 0) {
      return {
        averageScore: 0,
        commonKeywords: [],
        technicalTrends: {
          schemaUsage: 0,
          titleOptimization: 0,
          contentQuality: 0
        },
        contentGaps: [],
        recommendations: []
      };
    }

    // Calculate average metrics
    const totalScore = analyses.reduce((sum, a) => sum + a.analysis.overallScore, 0);
    const averageScore = totalScore / analyses.length;

    // Analyze technical trends
    const schemaUsage = analyses.filter(a => a.analysis.technicalSeo.schemaMarkup >= 70).length / analyses.length * 100;
    const titleOptimization = analyses.reduce((sum, a) => sum + a.analysis.technicalSeo.titleOptimization, 0) / analyses.length;
    const contentQuality = analyses.reduce((sum, a) => sum + 
      (a.analysis.contentQuality.clarity + a.analysis.contentQuality.structure + a.analysis.contentQuality.completeness) / 3, 0) / analyses.length;

    // Extract common keywords
    const allKeywords = analyses.flatMap(a => a.analysis.keywords.primary);
    const keywordCounts = new Map<string, number>();
    allKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });

    const commonKeywords = Array.from(keywordCounts.entries())
      .filter(([, count]) => count >= Math.max(2, analyses.length * 0.3))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // Identify content gaps
    const contentGaps = this.identifyContentGaps(analyses);

    // Generate recommendations
    const recommendations = this.generateRecommendations(analyses, {
      averageScore,
      schemaUsage,
      titleOptimization,
      contentQuality
    });

    return {
      averageScore: Math.round(averageScore),
      commonKeywords,
      technicalTrends: {
        schemaUsage: Math.round(schemaUsage),
        titleOptimization: Math.round(titleOptimization),
        contentQuality: Math.round(contentQuality)
      },
      contentGaps,
      recommendations
    };
  }

  /**
   * Filter competitor search results
   */
  private filterCompetitorResults(
    results: FirecrawlSearchResult[],
    includeDomains: string[],
    excludeDomains: string[],
    maxResults: number
  ): FirecrawlSearchResult[] {
    let filtered = results.filter(result => {
      try {
        const domain = new URL(result.url).hostname;
        
        // Apply include filter
        if (includeDomains.length > 0) {
          const included = includeDomains.some(includeDomain => 
            domain.includes(includeDomain) || includeDomain.includes(domain)
          );
          if (!included) return false;
        }

        // Apply exclude filter
        if (excludeDomains.length > 0) {
          const excluded = excludeDomains.some(excludeDomain => 
            domain.includes(excludeDomain) || excludeDomain.includes(domain)
          );
          if (excluded) return false;
        }

        return true;
      } catch {
        return false; // Invalid URL
      }
    });

    // Remove duplicates by domain (keep only the first result per domain)
    const seenDomains = new Set<string>();
    filtered = filtered.filter(result => {
      try {
        const domain = new URL(result.url).hostname;
        if (seenDomains.has(domain)) return false;
        seenDomains.add(domain);
        return true;
      } catch {
        return false;
      }
    });

    return filtered.slice(0, maxResults);
  }

  /**
   * Identify content gaps in the market
   */
  private identifyContentGaps(analyses: CompetitorAnalysis[]): string[] {
    const gaps: string[] = [];

    // Check for common missing elements
    const hasDefinitions = analyses.filter(a => 
      a.competitiveInsights.strengths.some(s => s.includes('definitions'))
    ).length / analyses.length;

    const hasFaqs = analyses.filter(a => 
      a.competitiveInsights.strengths.some(s => s.includes('FAQ'))
    ).length / analyses.length;

    const hasSchema = analyses.filter(a => 
      a.analysis.technicalSeo.schemaMarkup >= 70
    ).length / analyses.length;

    if (hasDefinitions < 0.5) {
      gaps.push('Most competitors lack clear term definitions - opportunity for educational content');
    }

    if (hasFaqs < 0.4) {
      gaps.push('FAQ sections are uncommon - opportunity to address user questions directly');
    }

    if (hasSchema < 0.3) {
      gaps.push('Schema markup is underutilized - technical SEO advantage available');
    }

    // Check content depth
    const avgCompleteness = analyses.reduce((sum, a) => sum + a.analysis.contentQuality.completeness, 0) / analyses.length;
    if (avgCompleteness < 70) {
      gaps.push('Market shows opportunity for more comprehensive, in-depth content');
    }

    return gaps;
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(analyses: CompetitorAnalysis[], trends: any): string[] {
    const recommendations: string[] = [];

    if (trends.averageScore < 75) {
      recommendations.push('Market has low average SEO scores - opportunity to lead with optimized content');
    }

    if (trends.schemaUsage < 50) {
      recommendations.push('Implement comprehensive schema markup for competitive advantage');
    }

    if (trends.contentQuality < 75) {
      recommendations.push('Focus on content clarity and structure to outperform competitors');
    }

    if (trends.titleOptimization < 80) {
      recommendations.push('Optimize page titles more effectively than current market standards');
    }

    // Always include these strategic recommendations
    recommendations.push('Monitor competitor content updates regularly for emerging trends');
    recommendations.push('Target long-tail keywords that competitors are missing');
    recommendations.push('Create more comprehensive content than top competitors');

    return recommendations;
  }
}