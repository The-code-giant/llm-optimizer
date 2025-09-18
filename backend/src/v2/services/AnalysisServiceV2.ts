import { FirecrawlService, FirecrawlScrapeResult } from './FirecrawlService';
import { db } from '../../db/client';
import { pages, contentAnalysis } from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface EnhancedAnalysisResult {
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
    semantic: string[];
    density: number;
  };
  llmOptimization: {
    definitionsPresent: boolean;
    faqsPresent: boolean;
    structuredData: boolean;
    citationFriendly: boolean;
    topicCoverage: number;
    answerableQuestions: number;
  };
  recommendations: string[];
  enhancedContent?: {
    extractedText: string;
    markdown: string;
    metadata: Record<string, any>;
  };
  confidence: number;
}

export class AnalysisServiceV2 {
  private firecrawlService: FirecrawlService;

  constructor(firecrawlService: FirecrawlService) {
    this.firecrawlService = firecrawlService;
  }

  /**
   * Enhanced page analysis using Firecrawl for better content extraction
   */
  async analyzePageEnhanced(url: string): Promise<EnhancedAnalysisResult> {
    try {
      // Extract content using Firecrawl
      const firecrawlResult = await this.firecrawlService.scrapeUrl(url, {
        extractMainContent: true,
        includeLinks: true
      });

      if (!firecrawlResult.success || !firecrawlResult.data) {
        throw new Error(`Failed to extract content: ${firecrawlResult.error}`);
      }

      const { content, markdown, metadata } = firecrawlResult.data;

      // Perform enhanced analysis with extracted content
      const analysis = await this.performEnhancedAnalysis(content, metadata, url);

      // Add enhanced content info
      analysis.enhancedContent = {
        extractedText: content,
        markdown,
        metadata
      };

      return analysis;
    } catch (error: any) {
      throw new Error(`Enhanced analysis failed: ${error.message}`);
    }
  }

  /**
   * Perform detailed analysis on extracted content
   */
  private async performEnhancedAnalysis(
    content: string,
    metadata: Record<string, any>,
    url: string
  ): Promise<EnhancedAnalysisResult> {
    // Content quality analysis
    const contentQuality = this.analyzeContentQuality(content);
    
    // Technical SEO analysis
    const technicalSeo = this.analyzeTechnicalSeo(metadata, content);
    
    // Keyword analysis
    const keywords = this.analyzeKeywords(content, metadata);
    
    // LLM optimization analysis
    const llmOptimization = this.analyzeLlmOptimization(content, metadata);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      contentQuality,
      technicalSeo,
      keywords,
      llmOptimization
    );

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      contentQuality,
      technicalSeo,
      keywords,
      llmOptimization
    );

    return {
      overallScore,
      contentQuality,
      technicalSeo,
      keywords,
      llmOptimization,
      recommendations,
      confidence: 0.9 // High confidence with Firecrawl extraction
    };
  }

  /**
   * Analyze content quality metrics
   */
  private analyzeContentQuality(content: string): EnhancedAnalysisResult['contentQuality'] {
    const wordCount = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Clarity: Based on sentence length and readability
    const avgSentenceLength = wordCount / sentences.length;
    const clarity = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 15) * 2));

    // Structure: Based on paragraph distribution and content organization
    const avgParagraphLength = wordCount / paragraphs.length;
    const structure = Math.max(0, Math.min(100, 80 + (paragraphs.length > 3 ? 20 : 0)));

    // Completeness: Based on content length and depth
    const completeness = Math.min(100, (wordCount / 300) * 100);

    return {
      clarity: Math.round(clarity),
      structure: Math.round(structure),
      completeness: Math.round(completeness)
    };
  }

  /**
   * Analyze technical SEO factors
   */
  private analyzeTechnicalSeo(metadata: Record<string, any>, content: string): EnhancedAnalysisResult['technicalSeo'] {
    // Title optimization
    const title = metadata.title || '';
    const titleOptimization = this.scoreTitle(title);

    // Meta description
    const description = metadata.description || '';
    const metaDescription = this.scoreMetaDescription(description);

    // Heading structure
    const headingStructure = this.scoreHeadingStructure(content);

    // Schema markup
    const schemaMarkup = this.scoreSchemaMarkup(metadata);

    return {
      titleOptimization,
      metaDescription,
      headingStructure,
      schemaMarkup
    };
  }

  /**
   * Analyze keywords and semantic content
   */
  private analyzeKeywords(content: string, metadata: Record<string, any>): EnhancedAnalysisResult['keywords'] {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Extract primary keywords (most frequent)
    const primary = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Extract long-tail keywords (phrases)
    const longTail = this.extractLongTailKeywords(content);

    // Extract semantic keywords
    const semantic = this.extractSemanticKeywords(content, primary);

    // Calculate keyword density
    const totalWords = words.length;
    const primaryKeywordCount = primary.reduce((sum, keyword) => 
      sum + (wordFreq.get(keyword) || 0), 0);
    const density = (primaryKeywordCount / totalWords) * 100;

    return {
      primary,
      longTail,
      semantic,
      density: Math.round(density * 100) / 100
    };
  }

  /**
   * Analyze LLM optimization factors
   */
  private analyzeLlmOptimization(content: string, metadata: Record<string, any>): EnhancedAnalysisResult['llmOptimization'] {
    const lowerContent = content.toLowerCase();

    return {
      definitionsPresent: /definition|define|means|refers to|is a/.test(lowerContent),
      faqsPresent: /frequently asked|faq|question|answer/.test(lowerContent),
      structuredData: Object.keys(metadata).some(key => key.includes('schema') || key.includes('structured')),
      citationFriendly: /source|reference|according to|study|research/.test(lowerContent),
      topicCoverage: this.calculateTopicCoverage(content),
      answerableQuestions: this.calculateAnswerableQuestions(content)
    };
  }

  // Helper methods
  private scoreTitle(title: string): number {
    if (!title) return 0;
    const length = title.length;
    if (length < 30) return 60;
    if (length > 60) return 70;
    return 100;
  }

  private scoreMetaDescription(description: string): number {
    if (!description) return 0;
    const length = description.length;
    if (length < 120) return 60;
    if (length > 160) return 70;
    return 100;
  }

  private scoreHeadingStructure(content: string): number {
    const h1Count = (content.match(/^# /gm) || []).length;
    const h2Count = (content.match(/^## /gm) || []).length;
    const h3Count = (content.match(/^### /gm) || []).length;
    
    if (h1Count === 1 && h2Count > 0) return 100;
    if (h1Count === 1) return 80;
    if (h1Count > 1) return 60;
    return 40;
  }

  private scoreSchemaMarkup(metadata: Record<string, any>): number {
    const hasSchema = Object.keys(metadata).some(key => 
      key.includes('schema') || key.includes('structured')
    );
    return hasSchema ? 100 : 0;
  }

  private extractLongTailKeywords(content: string): string[] {
    const phrases = content.match(/\b\w+\s+\w+\s+\w+\b/g) || [];
    return [...new Set(phrases.slice(0, 10))];
  }

  private extractSemanticKeywords(content: string, primary: string[]): string[] {
    // Simple semantic analysis - find related terms
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const semantic = words.filter(word => 
      word.length > 4 && 
      !primary.includes(word) &&
      words.filter(w => w === word).length > 2
    );
    return [...new Set(semantic)].slice(0, 10);
  }

  private calculateTopicCoverage(content: string): number {
    const wordCount = content.split(/\s+/).length;
    const uniqueWords = new Set(content.toLowerCase().match(/\b\w+\b/g) || []);
    const coverage = (uniqueWords.size / wordCount) * 100;
    return Math.min(100, Math.round(coverage * 10));
  }

  private calculateAnswerableQuestions(content: string): number {
    const questions = content.match(/\?/g) || [];
    const answers = content.match(/answer|because|due to|result|therefore/gi) || [];
    const ratio = answers.length / Math.max(1, questions.length);
    return Math.min(100, Math.round(ratio * 50));
  }

  private generateRecommendations(
    contentQuality: EnhancedAnalysisResult['contentQuality'],
    technicalSeo: EnhancedAnalysisResult['technicalSeo'],
    keywords: EnhancedAnalysisResult['keywords'],
    llmOptimization: EnhancedAnalysisResult['llmOptimization']
  ): string[] {
    const recommendations: string[] = [];

    if (contentQuality.clarity < 70) {
      recommendations.push('Improve content clarity by using shorter sentences and simpler language');
    }
    if (contentQuality.structure < 70) {
      recommendations.push('Enhance content structure with better paragraph organization');
    }
    if (technicalSeo.titleOptimization < 80) {
      recommendations.push('Optimize page title length (30-60 characters)');
    }
    if (technicalSeo.metaDescription < 80) {
      recommendations.push('Add or improve meta description (120-160 characters)');
    }
    if (!llmOptimization.definitionsPresent) {
      recommendations.push('Add clear definitions for key terms to improve LLM understanding');
    }
    if (!llmOptimization.faqsPresent) {
      recommendations.push('Include FAQ section to answer common questions');
    }

    return recommendations;
  }

  private calculateOverallScore(
    contentQuality: EnhancedAnalysisResult['contentQuality'],
    technicalSeo: EnhancedAnalysisResult['technicalSeo'],
    keywords: EnhancedAnalysisResult['keywords'],
    llmOptimization: EnhancedAnalysisResult['llmOptimization']
  ): number {
    const contentScore = (contentQuality.clarity + contentQuality.structure + contentQuality.completeness) / 3;
    const techScore = (technicalSeo.titleOptimization + technicalSeo.metaDescription + technicalSeo.headingStructure + technicalSeo.schemaMarkup) / 4;
    const keywordScore = Math.min(100, keywords.density * 10);
    const llmScore = (
      (llmOptimization.definitionsPresent ? 100 : 0) +
      (llmOptimization.faqsPresent ? 100 : 0) +
      (llmOptimization.structuredData ? 100 : 0) +
      (llmOptimization.citationFriendly ? 100 : 0) +
      llmOptimization.topicCoverage +
      llmOptimization.answerableQuestions
    ) / 6;

    return Math.round((contentScore * 0.3 + techScore * 0.3 + keywordScore * 0.2 + llmScore * 0.2));
  }

  /**
   * Save enhanced analysis to database
   */
  async saveEnhancedAnalysis(pageId: string, analysis: EnhancedAnalysisResult): Promise<string> {
    const analysisRecord = await db.insert(contentAnalysis).values({
      pageId,
      overallScore: analysis.overallScore,
      llmModelUsed: 'firecrawl-enhanced',
      contentClarity: analysis.contentQuality.clarity,
      contentStructure: analysis.contentQuality.structure,
      contentCompleteness: analysis.contentQuality.completeness,
      titleOptimization: analysis.technicalSeo.titleOptimization,
      metaDescription: analysis.technicalSeo.metaDescription,
      headingStructure: analysis.technicalSeo.headingStructure,
      schemaMarkup: analysis.technicalSeo.schemaMarkup,
      primaryKeywords: analysis.keywords.primary,
      longTailKeywords: analysis.keywords.longTail,
      keywordDensity: analysis.keywords.density,
      semanticKeywords: analysis.keywords.semantic,
      definitionsPresent: analysis.llmOptimization.definitionsPresent ? 1 : 0,
      faqsPresent: analysis.llmOptimization.faqsPresent ? 1 : 0,
      structuredData: analysis.llmOptimization.structuredData ? 1 : 0,
      citationFriendly: analysis.llmOptimization.citationFriendly ? 1 : 0,
      topicCoverage: analysis.llmOptimization.topicCoverage,
      answerableQuestions: analysis.llmOptimization.answerableQuestions,
      confidence: analysis.confidence,
      analysisVersion: '2.0'
    }).returning();

    return analysisRecord[0].id;
  }
}