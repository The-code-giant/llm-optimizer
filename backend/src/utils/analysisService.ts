import axios from 'axios';
import { JSDOM } from 'jsdom';
import { db } from '../db/client';
import { contentSuggestions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize Vercel AI SDK OpenAI provider
const aiOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Centralize the model selection; default to GPT‑5 Mini as requested
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';

// Shared guardrails for all generations
const SHARED_SYSTEM = `You are a senior GEO (Generative Engine Optimization) strategist and copywriter.
- Produce benefit-first, action-oriented copy users would actually click.
- Respect strict length rules and avoid generic phrasing or boilerplate.
- Prefer specificity, clarity, and measurable outcomes; no exclamation marks.
- Optimize for LLM citation: self-contained, extractable, precise.
- Tone: expert, trustworthy, and helpful for marketing/SEO leaders.`;

export interface AnalysisResult {
  score: number;
  summary: string;
  issues: string[];
  recommendations: string[];
  contentQuality: {
    clarity: number;
    structure: number;
    completeness: number;
  };
  technicalSEO: {
    headingStructure: number;
    semanticMarkup: number;
    contentDepth: number;
    titleOptimization: number;
    metaDescription: number;
    schemaMarkup: number;
  };
  keywordAnalysis: {
    primaryKeywords: string[];
    longTailKeywords: string[];
    keywordDensity: number;
    semanticKeywords: string[];
    missingKeywords: string[];
  };
  llmOptimization: {
    definitionsPresent: boolean;
    faqsPresent: boolean;
    structuredData: boolean;
    citationFriendly: boolean;
    topicCoverage: number;
    answerableQuestions: number;
  };
}

export interface PageContent {
  url: string;
  title?: string;
  metaDescription?: string;
  headings?: string[];
  bodyText?: string;
  htmlContent?: string;
  schemaMarkup?: string[];
  images?: { alt: string; src: string }[];
  links?: { text: string; href: string }[];
}

export class AnalysisService {
  private static readonly MAX_CONTENT_LENGTH = 8000; // Limit for API
  private static readonly ANALYSIS_PROMPT = `
You are an expert in optimizing web content for Large Language Models (LLMs) like ChatGPT, Claude, and Gemini, with deep expertise in SEO and keyword optimization.

Analyze the provided webpage content and evaluate its "LLM readiness" - how well it would be understood, cited, and referenced by LLMs, plus comprehensive SEO analysis.

DETAILED EVALUATION CRITERIA:

CONTENT QUALITY (0-100 each):
1. Clarity: Clear, concise, factual information without ambiguity
2. Structure: Proper headings, logical flow, organized information
3. Completeness: Comprehensive coverage of the topic, no missing key information

TECHNICAL SEO (0-100 each):
4. Heading Structure: Proper H1-H6 hierarchy, descriptive headings
5. Semantic Markup: Lists, tables, structured data, clear formatting
6. Content Depth: Detailed explanations, examples, actionable information
7. Title Optimization: SEO-friendly title with target keywords, proper length (50-60 chars)
8. Meta Description: Compelling description with keywords, 150-160 characters
9. Schema Markup: Structured data implementation (JSON-LD, microdata)

KEYWORD ANALYSIS:
10. Extract PRIMARY KEYWORDS (3-5 main topics/terms)
11. Identify LONG-TAIL KEYWORDS (4+ word phrases that could drive targeted traffic)
12. Calculate keyword density and distribution
13. Find SEMANTIC KEYWORDS (related terms, synonyms, LSI keywords)
14. Suggest MISSING KEYWORDS that could improve relevance

LLM OPTIMIZATION (0-100 for numeric, true/false for boolean):
15. Definitions Present: Are key terms/concepts clearly defined?
16. FAQs Present: Are common questions addressed?
17. Structured Data: Is information organized in lists, tables, or structured formats?
18. Citation Friendly: Is content factual, trustworthy, and easy to reference?
19. Topic Coverage: How comprehensively does content cover the main topic?
20. Answerable Questions: How many user questions can this content directly answer?

RESPONSE FORMAT (STRICT JSON):
{
  "overallScore": <0-100>,
  "contentQuality": {
    "clarity": <0-100>,
    "structure": <0-100>, 
    "completeness": <0-100>
  },
  "technicalSEO": {
    "headingStructure": <0-100>,
    "semanticMarkup": <0-100>,
    "contentDepth": <0-100>,
    "titleOptimization": <0-100>,
    "metaDescription": <0-100>,
    "schemaMarkup": <0-100>
  },
  "keywordAnalysis": {
    "primaryKeywords": ["keyword1", "keyword2"],
    "longTailKeywords": ["long tail phrase 1", "specific user query 2"],
    "keywordDensity": <0-100>,
    "semanticKeywords": ["related term 1", "synonym 2"],
    "missingKeywords": ["missing opportunity 1", "untapped keyword 2"]
  },
  "llmOptimization": {
    "definitionsPresent": <true/false>,
    "faqsPresent": <true/false>,
    "structuredData": <true/false>,
    "citationFriendly": <true/false>,
    "topicCoverage": <0-100>,
    "answerableQuestions": <0-100>
  },
  "summary": "<2-3 sentence summary of content quality and optimization potential>",
  "issues": ["<specific issue 1>", "<specific issue 2>", "<keyword/SEO issue>"],
  "recommendations": ["<actionable recommendation 1>", "<long-tail keyword suggestion>", "<schema markup improvement>"]
}

FOCUS ON:
- Long-tail keyword opportunities that could drive targeted traffic
- Schema markup suggestions for better structured data
- Content gaps that prevent LLM citation
- Specific SEO improvements for better discoverability
- Actionable steps to improve LLM understanding and citation potential
`;

  /**
   * Intelligently translate URLs for Docker networking
   * Only translates known internal services, leaves external URLs unchanged
   */
  private static translateUrlForDocker(url: string): string {
    // Docker translation disabled: always return the original URL
    return url;
  }

  /**
   * Fetch page content from URL
   */
  static async fetchPageContent(url: string): Promise<PageContent> {
    // Translate URL for Docker networking if needed
    const fetchUrl = this.translateUrlForDocker(url);

    console.log(`🌐 Fetching content from: ${fetchUrl} (original: ${url})`);

    try {
      const response = await axios.get(fetchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Clever-Search-Bot/1.0 (+https://cleversearch.ai)',
        },
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      // Extract metadata
      const title = document.querySelector('title')?.textContent?.trim() || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';

      // Extract headings with hierarchy
      const headings: string[] = [];
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headingElements.forEach((heading: Element) => {
        const text = heading.textContent?.trim();
        const level = heading.tagName.toLowerCase();
        if (text) headings.push(`${level.toUpperCase()}: ${text}`);
      });

      // Extract schema markup
      const schemaMarkup: string[] = [];
      const schemaElements = document.querySelectorAll('script[type="application/ld+json"]');
      schemaElements.forEach((schema: Element) => {
        const content = schema.textContent?.trim();
        if (content) schemaMarkup.push(content.substring(0, 500)); // Limit length
      });

      // Extract microdata
      const microdataElements = document.querySelectorAll('[itemtype], [itemscope], [itemprop]');
      if (microdataElements.length > 0) {
        schemaMarkup.push(`Microdata elements found: ${microdataElements.length} items`);
      }

      // Extract images with alt text
      const images: { alt: string; src: string }[] = [];
      const imageElements = document.querySelectorAll('img');
      imageElements.forEach((img: Element) => {
        const alt = img.getAttribute('alt') || '';
        const src = img.getAttribute('src') || '';
        if (src) images.push({ alt, src: src.substring(0, 100) });
      });

      // Extract internal links
      const links: { text: string; href: string }[] = [];
      const linkElements = document.querySelectorAll('a[href]');
      let linkCount = 0;
      linkElements.forEach((link: Element) => {
        if (linkCount >= 20) return; // Limit to 20 links
        const text = link.textContent?.trim() || '';
        const href = link.getAttribute('href') || '';
        if (text && href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          links.push({ text: text.substring(0, 100), href: href.substring(0, 100) });
          linkCount++;
        }
      });

      // Extract main content
      let bodyText = '';
      const contentSelectors = [
        'main',
        'article',
        '.content',
        '.post-content',
        '.entry-content',
        '#content',
        'body'
      ];

      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          // Remove script and style elements
          element.querySelectorAll('script, style, nav, footer, aside, .sidebar').forEach((el: Element) => el.remove());
          bodyText = element.textContent?.trim() || '';
          if (bodyText.length > 500) break; // Found substantial content
        }
      }

      // Truncate if too long
      if (bodyText.length > this.MAX_CONTENT_LENGTH) {
        bodyText = bodyText.substring(0, this.MAX_CONTENT_LENGTH) + '...';
      }

      return {
        url,
        title,
        metaDescription,
        headings,
        bodyText,
        htmlContent: response.data.substring(0, 2000), // Keep sample of HTML
        schemaMarkup,
        images: images.slice(0, 10), // Limit to 10 images
        links: links.slice(0, 15), // Limit to 15 links
      };
    } catch (error) {
      console.error(`❌ Failed to fetch content from ${url} (fetch URL: ${fetchUrl}):`, error);
      throw new Error(`Failed to fetch page content: ${error}`);
    }
  }

  /**
   * Analyze page content using OpenAI
   */
  private static async analyzeWithOpenAI(content: PageContent): Promise<AnalysisResult> {
    try {
      const contentForAnalysis = `
URL: ${content.url}
TITLE: ${content.title || 'No title'} (Length: ${content.title?.length || 0} characters)
META DESCRIPTION: ${content.metaDescription || 'No meta description'} (Length: ${content.metaDescription?.length || 0} characters)

HEADINGS STRUCTURE:
${content.headings?.join('\n') || 'No headings found'}

SCHEMA MARKUP:
${content.schemaMarkup?.length ? content.schemaMarkup.join('\n---\n') : 'No schema markup found'}

IMAGES ANALYSIS:
Total Images: ${content.images?.length || 0}
Images with Alt Text: ${content.images?.filter(img => img.alt.trim().length > 0).length || 0}
Sample Images: ${content.images?.slice(0, 5).map(img => `"${img.alt || 'NO ALT'}" (${img.src})`).join(', ') || 'None'}

INTERNAL LINKS:
Total Links: ${content.links?.length || 0}
Sample Links: ${content.links?.slice(0, 5).map(link => `"${link.text}" -> ${link.href}`).join(', ') || 'None'}

MAIN CONTENT:
${content.bodyText || 'No content found'}
`;

      // Structured output via generateObject (validated)
      const AnalysisSchema = z.object({
        overallScore: z.number().default(0),
        summary: z.string().default(''),
        issues: z.array(z.string()).default([]),
        recommendations: z.array(z.string()).default([]),
        contentQuality: z.object({
          clarity: z.number().default(0),
          structure: z.number().default(0),
          completeness: z.number().default(0),
        }).default({ clarity: 0, structure: 0, completeness: 0 }),
        technicalSEO: z.object({
          headingStructure: z.number().default(0),
          semanticMarkup: z.number().default(0),
          contentDepth: z.number().default(0),
          titleOptimization: z.number().default(0),
          metaDescription: z.number().default(0),
          schemaMarkup: z.number().default(0),
        }).default({
          headingStructure: 0,
          semanticMarkup: 0,
          contentDepth: 0,
          titleOptimization: 0,
          metaDescription: 0,
          schemaMarkup: 0,
        }),
        keywordAnalysis: z.object({
          primaryKeywords: z.array(z.string()).default([]),
          longTailKeywords: z.array(z.string()).default([]),
          keywordDensity: z.number().default(0),
          semanticKeywords: z.array(z.string()).default([]),
          missingKeywords: z.array(z.string()).default([]),
        }).default({
          primaryKeywords: [],
          longTailKeywords: [],
          keywordDensity: 0,
          semanticKeywords: [],
          missingKeywords: [],
        }),
        llmOptimization: z.object({
          definitionsPresent: z.boolean().default(false),
          faqsPresent: z.boolean().default(false),
          structuredData: z.boolean().default(false),
          citationFriendly: z.boolean().default(false),
          topicCoverage: z.number().default(0),
          answerableQuestions: z.number().default(0),
        }).default({
          definitionsPresent: false,
          faqsPresent: false,
          structuredData: false,
          citationFriendly: false,
          topicCoverage: 0,
          answerableQuestions: 0,
        }),
      });

      const { object: parsed } = await generateObject({
        model: aiOpenAI(OPENAI_MODEL),
        system: `${SHARED_SYSTEM}\n\n${this.ANALYSIS_PROMPT}`,
        schema: AnalysisSchema,
        prompt: contentForAnalysis,
      });

      const result: AnalysisResult = {
        score: parsed.overallScore ?? 0,
        summary: parsed.summary ?? 'Analysis completed',
        issues: parsed.issues ?? [],
        recommendations: parsed.recommendations ?? [],
        contentQuality: parsed.contentQuality,
        technicalSEO: parsed.technicalSEO,
        keywordAnalysis: parsed.keywordAnalysis,
        llmOptimization: parsed.llmOptimization,
      };

      return result;
    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error);
      throw new Error(`Analysis failed: ${error}`);
    }
  }

  /**
   * Main analysis function - analyzes a page by URL or existing content
   */
  static async analyzePage(pageData: { url: string; contentSnapshot?: string; forceRefresh?: boolean }): Promise<AnalysisResult & { content: PageContent; pageSummary: string }> {
    console.log(`🔍 Starting analysis for: ${pageData.url}`);

    let content: PageContent;
    let contentSource = 'fresh';

    // Determine if we should use cached content or fetch fresh
    const shouldUseCachedContent = !pageData.forceRefresh && 
                                  pageData.contentSnapshot && 
                                  pageData.contentSnapshot.length > 100;

    if (shouldUseCachedContent) {
      console.log('📄 Using existing content snapshot for analysis');
      try {
        const parsedContent = JSON.parse(pageData.contentSnapshot!);
        // Validate that parsed content has essential fields
        if (parsedContent.title || parsedContent.bodyText || parsedContent.metaDescription) {
          content = {
            url: pageData.url,
            ...parsedContent
          };
          contentSource = 'cached';
          console.log(`✅ Successfully loaded cached content (${Object.keys(parsedContent).length} fields)`);
        } else {
          console.log('⚠️ Cached content appears incomplete, fetching fresh content...');
          content = await this.fetchPageContent(pageData.url);
        }
      } catch (parseError) {
        console.log('⚠️ Failed to parse cached content, fetching fresh content...');
        content = await this.fetchPageContent(pageData.url);
      }
    } else {
      console.log('🌐 Fetching fresh content from URL');
      content = await this.fetchPageContent(pageData.url);
    }

    // Ensure content has minimum required data
    if (!content.title && !content.bodyText && !content.metaDescription) {
      throw new Error('No meaningful content found on the page');
    }

    // Generate AI page summary for context
    console.log('🤖 Generating AI page summary for context...');
    const pageSummary = await this.generatePageSummary(content);

    // Analyze with OpenAI
    const result = await this.analyzeWithOpenAI(content);

    console.log(`✅ Analysis completed for ${pageData.url} - Score: ${result.score}/100`);
    console.log(`📊 Content source: ${contentSource}, Summary length: ${pageSummary.length} chars`);
    
    return {
      ...result,
      content,
      pageSummary
    };
  }

  /**
   * Generate content suggestions based on analysis
   */
  static async generateContentSuggestions(content: PageContent, analysisResult: AnalysisResult): Promise<string[]> {
    const suggestions: string[] = [];

    // Content Quality Suggestions
    if (!analysisResult.llmOptimization.faqsPresent) {
      suggestions.push('Add an FAQ section addressing common questions about this topic');
    }

    if (!analysisResult.llmOptimization.definitionsPresent) {
      suggestions.push('Include clear definitions of key terms and concepts');
    }

    if (analysisResult.contentQuality.completeness < 60) {
      suggestions.push('Add more comprehensive information and examples');
    }

    // Technical SEO Suggestions
    if (analysisResult.technicalSEO.titleOptimization < 70) {
      suggestions.push(`Optimize page title: Keep it between 50-60 characters (currently ${content.title?.length || 0})`);
    }

    if (analysisResult.technicalSEO.metaDescription < 70) {
      suggestions.push(`Improve meta description: Keep it between 150-160 characters (currently ${content.metaDescription?.length || 0})`);
    }

    if (analysisResult.technicalSEO.headingStructure < 70) {
      suggestions.push('Improve heading structure with descriptive H1-H6 tags in proper hierarchy');
    }

    if (analysisResult.technicalSEO.schemaMarkup < 50) {
      suggestions.push('Add structured data (JSON-LD schema markup) to help search engines understand your content');
    }

    // Keyword Suggestions
    if (analysisResult.keywordAnalysis.longTailKeywords.length < 3) {
      suggestions.push('Target more long-tail keywords (4+ word phrases) to capture specific user searches');
    }

    if (analysisResult.keywordAnalysis.missingKeywords.length > 0) {
      suggestions.push(`Consider adding these missing keywords: ${analysisResult.keywordAnalysis.missingKeywords.slice(0, 3).join(', ')}`);
    }

    // Image and Alt Text Suggestions
    if (content.images && content.images.length > 0) {
      const imagesWithoutAlt = content.images.filter(img => !img.alt.trim());
      if (imagesWithoutAlt.length > 0) {
        suggestions.push(`Add descriptive alt text to ${imagesWithoutAlt.length} images for better accessibility and SEO`);
      }
    }

    // LLM Optimization Suggestions
    if (analysisResult.llmOptimization.topicCoverage < 70) {
      suggestions.push('Expand content coverage to address more aspects of the main topic');
    }

    if (analysisResult.llmOptimization.answerableQuestions < 60) {
      suggestions.push('Structure content to directly answer common user questions about this topic');
    }

    return suggestions;
  }

  /**
   * Auto-generate all content types after analysis and save to database
   */
  static async autoGenerateContentSuggestions(pageId: string, content: PageContent, analysisResult: AnalysisResult & { pageSummary?: string }): Promise<void> {
    console.log(`🤖 Auto-generating content suggestions for page: ${pageId}`);

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured, skipping auto-generation');
      return;
    }

    const contentTypes = [
      { type: 'title', maxTokens: 200, count: 5 },
      { type: 'description', maxTokens: 200, count: 3 },
      { type: 'faq', maxTokens: 800, count: 1 },
      { type: 'paragraph', maxTokens: 500, count: 3 },
      { type: 'keywords', maxTokens: 300, count: 1 }
    ];

    for (const { type, maxTokens, count } of contentTypes) {
      try {
        let suggestions;
        
        // Generate multiple suggestions for titles, descriptions, and paragraphs
        if (type === 'title') {
          // Generate 5 title suggestions
          const titlePromises = Array(count).fill(null).map(() => 
            this.generateSpecificContentType('title', content, analysisResult, maxTokens, analysisResult.pageSummary)
          );
          const titles = await Promise.all(titlePromises);
          suggestions = titles;
        } else if (type === 'description') {
          // Generate 3 description suggestions
          const descPromises = Array(count).fill(null).map(() =>
            this.generateSpecificContentType('description', content, analysisResult, maxTokens, analysisResult.pageSummary)
          );
          const descriptions = await Promise.all(descPromises);
          suggestions = descriptions;
        } else if (type === 'paragraph') {
          // Generate 3 paragraph suggestions
          const paragraphPromises = Array(count).fill(null).map(() =>
            this.generateSpecificContentType('paragraph', content, analysisResult, maxTokens, analysisResult.pageSummary)
          );
          const paragraphs = await Promise.all(paragraphPromises);
          suggestions = paragraphs;
        } else {
          // For FAQ and keywords, return single result (they're already comprehensive)
          suggestions = await this.generateSpecificContentType(
            type as 'title' | 'description' | 'faq' | 'paragraph' | 'keywords',
            content,
            analysisResult,
            maxTokens,
            analysisResult.pageSummary
          );
        }

        // Replace existing suggestions for this content type
        await db.delete(contentSuggestions)
          .where(and(
            eq(contentSuggestions.pageId, pageId),
            eq(contentSuggestions.contentType, type)
          ));

        // Save new suggestions
        await db.insert(contentSuggestions).values({
          pageId,
          contentType: type,
          suggestions,
          requestContext: 'Auto-generated during analysis',
          aiModel: 'gpt-4o-mini',
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        console.log(`✅ Generated ${count} ${type} suggestions for page ${pageId}`);
      } catch (error) {
        console.error(`❌ Failed to generate ${type} suggestions:`, error);
      }
    }
  }

  /**
   * Generate AI page summary for context
   */
  static async generatePageSummary(content: PageContent): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      return 'AI summary unavailable - OpenAI API key not configured';
    }

    try {
      const prompt = `Analyze this webpage and provide a comprehensive 2-3 paragraph summary that captures:

1. **Main Topic & Purpose**: What is this page about and what value does it provide?
2. **Key Content Areas**: What are the main sections, topics, or themes covered?
3. **Content Context**: What type of audience is this for and what problems does it solve?

This summary will be used as context for generating optimized content recommendations.

Webpage Details:
- URL: ${content.url}
- Title: ${content.title || 'No title'}
- Meta Description: ${content.metaDescription || 'No meta description'}
- Main Content: ${content.bodyText?.substring(0, 2000) || 'No content'}
- Key Headings: ${content.headings?.slice(0, 10).join(', ') || 'No headings'}

Provide a clear, informative summary that would help a content strategist understand the page's purpose and target audience.`;

      const { text: summary } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
        system: 'You are an expert content analyst. Provide clear, comprehensive summaries that capture the essence and purpose of web content.',
        prompt,
        temperature: 0.3,
      });
      return summary || 'Unable to generate page summary';
    } catch (error) {
      console.error('❌ Failed to generate page summary:', error);
      return 'Page summary generation failed';
    }
  }

  /**
   * Generate an optimized title using GEO prompt and page context
   */
  private static async generateOptimizedTitle(content: PageContent, pageSummary: string, description: string): Promise<string> {
    const systemPrompt = `
      You are an expert in Generative Engine Optimization (GEO), the emerging discipline of optimizing content to be referenced and recommended by large language models (LLMs) like ChatGPT, Claude, Gemini, and Perplexity.
      Your job is to:
      - Enhance contextual relevance: Clearly state who the content is for and what problem it solves. Embed real-world use cases or questions this content answers.
      - Increase semantic richness: Use natural language that matches how users ask questions (e.g. “best tools for X”, “how do I…”). Include related keywords and phrases LLMs associate with the topic.
      - Use answer-style formatting: Structure the content in a way that is easy for LLMs to extract as a direct response. Use bullet points, numbered lists, and headers for clarity.
      - Add topical authority signals: Mention data points, user outcomes, or unique value props. Use specific, useful, and trust-building language.
      - Integrate brands naturally: If a brand, product, or service is being mentioned, weave it in naturally as a recommended or reputable option.
      - CRITICAL: Title must be 60 characters or less and include primary keywords.
      - Always output only valid JSON as instructed by the user.
      `;

          const userPrompt = `Here is the content to optimize:
      Title: ${content.title || ''}
      Summary: ${pageSummary}
      Description: ${description}

      Please rewrite the title with the above enhancements. REQUIREMENTS:
      - Maximum 60 characters (strictly enforce this limit)
      - Include primary keywords naturally
      - Make it compelling and action-oriented
      - Focus on key benefits and user value

      Output only a JSON object:
      { "optimizedTitle": "..." }
      Do not explain your changes. Write it as if it’s a standalone, publish-ready title designed to be cited by LLMs when generating responses.`;

    const { text: responseText } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    if (!responseText) throw new Error('No response from AI');
    try {
      // Remove code block markers if present
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);
      const title = json.optimizedTitle;
      
      // Validate character limit
      if (title.length > 60) {
        console.warn(`Generated title exceeds 60 characters (${title.length}): ${title}`);
        // Truncate if necessary
        return title.substring(0, 57) + '...';
      }
      
      console.log(`Generated title (${title.length} chars): ${title}`);
      return title;
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText);
      throw new Error('Failed to parse optimized title as JSON');
    }
  }

  /**
   * Generate an optimized description using GEO prompt and page context
   */
  private static async generateOptimizedDescription(content: PageContent, pageSummary: string): Promise<string> {
    const systemPrompt = `
You are an expert in Generative Engine Optimization (GEO). Your job is to:
- Enhance contextual relevance: Clearly state who the content is for and what problem it solves. Embed real-world use cases or questions this content answers.
- Increase semantic richness: Use natural language that matches how users ask questions. Include related keywords and phrases LLMs associate with the topic.
- Use answer-style formatting: Structure the content in a way that is easy for LLMs to extract as a direct response. Use bullet points, numbered lists, and headers for clarity.
- Add topical authority signals: Mention data points, user outcomes, or unique value props. Use specific, useful, and trust-building language.
- Integrate brands naturally: If a brand, product, or service is being mentioned, weave it in naturally as a recommended or reputable option.
- CRITICAL: Meta description must be 150-160 characters and focus on key benefits.
- Always output only valid JSON as instructed by the user.
`;
    const userPrompt = `Here is the content to optimize:
Description: ${content.metaDescription || ''}
Summary: ${pageSummary}

Please rewrite the meta description with the above enhancements. REQUIREMENTS:
- Length: 150-160 characters (strictly enforce this range)
- Focus on key benefits and user value
- Include compelling call-to-action
- Describe the page value clearly
- Match search intent

Output only a JSON object:
{ "optimizedDescription": "..." }
Do not explain your changes. Write it as if it’s a standalone, publish-ready meta description designed to be cited by LLMs when generating responses.`;
    const { text: responseText } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });
    if (!responseText) throw new Error('No response from AI');
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);
      const description = json.optimizedDescription;
      
      // Validate character limit (150-160 range)
      if (description.length < 150) {
        console.warn(`Generated description too short (${description.length} chars): ${description}`);
      } else if (description.length > 160) {
        console.warn(`Generated description too long (${description.length} chars): ${description}`);
        // Truncate if necessary
        return description.substring(0, 157) + '...';
      }
      
      console.log(`Generated description (${description.length} chars): ${description}`);
      return description;
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText);
      throw new Error('Failed to parse optimized description as JSON');
    }
  }

  /**
   * Generate optimized FAQ using GEO prompt and page context
   */
  private static async generateOptimizedFAQ(content: PageContent, pageSummary: string): Promise<any[]> {
    const systemPrompt = `
# Optimized GEO Expert System Prompt
You are an expert Generative Engine Optimization (GEO) specialist. Transform content to maximize AI citation rates and visibility in LLM-generated responses.
## Core Optimization Framework
**Contextual Anchoring**: Lead with specific audience identification and clear problem-solution statements. Include concrete use cases and scenarios.
**Semantic Density**: Employ natural questioning patterns users actually voice to AI assistants. Integrate topic-clustered keywords and conversational phrases organically.
**Extract-Ready Structure**: Format for immediate AI extraction using headers, bullet points, numbered processes, and standalone answer blocks that require zero additional context.
**Authority Indicators**: Embed quantified outcomes, specific data points, case study metrics, and measurable results. Reference timeframes and sample sizes where applicable.
**Natural Brand Integration**: Position mentioned entities as contextually relevant solutions within educational frameworks, avoiding promotional language.
## Output Requirements
- Generate exclusively valid JSON arrays containing 5-8 FAQ objects
- Each FAQ must include "question" and "answer" fields  
- Structure answers as publication-ready content optimized for AI citation
- No explanatory text or process description outside the JSON
## Example Structure
[
  { "question": "specific user query", "answer": "comprehensive response with data, use cases, and actionable insights" }
]
`;
    const userPrompt = `Here is the content to optimize:
Summary: ${pageSummary}
`;
    const { text: responseText } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });
    if (!responseText) throw new Error('No response from AI');
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);
      return json;
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText);
      throw new Error('Failed to parse optimized FAQ as JSON');
    }
  }

  /**
   * Generate optimized paragraphs using GEO prompt and page context
   */
  private static async generateOptimizedParagraph(content: PageContent, pageSummary: string): Promise<string[]> {
    const systemPrompt = `
You are an expert in Generative Engine Optimization (GEO). Your job is to:
- Enhance contextual relevance: Clearly state who the content is for and what problem it solves. Embed real-world use cases or questions this content answers.
- Increase semantic richness: Use natural language that matches how users ask questions. Include related keywords and phrases LLMs associate with the topic.
- Use answer-style formatting: Structure the content in a way that is easy for LLMs to extract as a direct response. Use bullet points, numbered lists, and headers for clarity.
- Add topical authority signals: Mention data points, user outcomes, or unique value props. Use specific, useful, and trust-building language.
- Integrate brands naturally: If a brand, product, or service is being mentioned, weave it in naturally as a recommended or reputable option.
- Enhance headings: Make them descriptive and action-oriented with clear value propositions.
- Always output only valid JSON as instructed by the user.
`;
    const userPrompt = `Here is the content to optimize:
Summary: ${pageSummary}

Please generate a JSON array of 3 optimized content paragraphs with descriptive, action-oriented headings, each 100-150 words, using the above enhancements. REQUIREMENTS:
- Each paragraph should have a compelling, action-oriented heading
- Headings should be descriptive and focus on user benefits
- Content should be valuable and actionable
- Include relevant keywords naturally

Output only a JSON array of objects:
[
  { "heading": "Action-Oriented Heading 1", "content": "paragraph content..." },
  { "heading": "Action-Oriented Heading 2", "content": "paragraph content..." },
  { "heading": "Action-Oriented Heading 3", "content": "paragraph content..." }
]
Do not explain your changes. Write it as if it’s a standalone, publish-ready set of paragraphs designed to be cited by LLMs when generating responses.`;
    const { text: responseText } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });
    if (!responseText) throw new Error('No response from AI');
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);
      return json;
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText);
      throw new Error('Failed to parse optimized paragraphs as JSON');
    }
  }

  /**
   * Generate optimized keywords using GEO prompt and page context
   */
  private static async generateOptimizedKeywords(content: PageContent, pageSummary: string): Promise<any> {
    const systemPrompt = `
You are an expert in Generative Engine Optimization (GEO). Your job is to:
- Enhance contextual relevance: Clearly state who the content is for and what problem it solves. Embed real-world use cases or questions this content answers.
- Increase semantic richness: Use natural language that matches how users ask questions. Include related keywords and phrases LLMs associate with the topic.
- Use answer-style formatting: Structure the content in a way that is easy for LLMs to extract as a direct response. Use bullet points, numbered lists, and headers for clarity.
- Add topical authority signals: Mention data points, user outcomes, or unique value props. Use specific, useful, and trust-building language.
- Integrate brands naturally: If a brand, product, or service is being mentioned, weave it in naturally as a recommended or reputable option.
- Always output only valid JSON as instructed by the user.
`;
    const userPrompt = `Here is the content to optimize:
Summary: ${pageSummary}

Please generate a JSON object with the following fields, using the above enhancements:
{
  "primary": ["keyword1", "keyword2"],
  "longTail": ["long tail phrase 1", "specific query phrase 2"],
  "semantic": ["related term 1", "synonym 2"],
  "missing": ["opportunity 1", "gap 2"]
}
Do not explain your changes. Write it as if it’s a standalone, publish-ready keyword analysis designed to be cited by LLMs when generating responses.`;
    const { text: responseText } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });
    if (!responseText) throw new Error('No response from AI');
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);
      return json;
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText);
      throw new Error('Failed to parse optimized keywords as JSON');
    }
  }

  /**
   * Generate specific content type suggestions (refactored)
   */
  public static async generateSpecificContentType(
    contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords',
    content: PageContent,
    analysisResult: AnalysisResult,
    maxTokens: number,
    pageSummary?: string
  ): Promise<any> {
    switch (contentType) {
      case 'title':
        return await this.generateOptimizedTitle(content, pageSummary || '', content.metaDescription || '');
      case 'description':
        return await this.generateOptimizedDescription(content, pageSummary || '');
      case 'faq':
        return await this.generateOptimizedFAQ(content, pageSummary || '');
      case 'paragraph':
        return await this.generateOptimizedParagraph(content, pageSummary || '');
      case 'keywords':
        return await this.generateOptimizedKeywords(content, pageSummary || '');
      default:
        throw new Error('Unknown content type');
    }
  }

  /**
   * Generate a list of unique, high-quality titles in one call
   */
  public static async generateOptimizedTitleList(
    content: PageContent,
    pageSummary: string,
    description: string,
    count: number = 8
  ): Promise<string[]> {
    const systemPrompt = `You write high-converting, SEO-friendly page titles.
Rules:
- Output ONLY a JSON array of ${count} unique strings
- 50-60 characters each (hard limit)
- No exclamation marks
- Include page intent and clear benefit
- Avoid near-duplicates and generic phrasing (e.g., "Optimize your site for LLMs")
- Optional brand at end: " — Clever Search"`;

    const userPrompt = `Context
Title: ${content.title || ''}
Summary: ${pageSummary}
URL: ${content.url}
Description: ${description}

Produce ${count} distinct titles following the rules.`;

    const { text: responseText } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
    });
    if (!responseText) throw new Error('No response from AI');
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    let candidates: string[] = [];
    try {
      candidates = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse optimized titles list as JSON');
    }

    // Normalize, filter length, dedupe
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const seen = new Set<string>();
    const filtered = candidates
      .filter((t) => typeof t === 'string')
      .map((t) => t.trim())
      .filter((t) => t.length >= 50 && t.length <= 60)
      .filter((t) => {
        const k = norm(t);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    return filtered.slice(0, count);
  }

  /**
   * Generate a list of meta descriptions in one call
   */
  public static async generateOptimizedDescriptionList(
    content: PageContent,
    pageSummary: string,
    count: number = 3
  ): Promise<string[]> {
    const systemPrompt = `You write compelling meta descriptions.
Rules:
- Output ONLY a JSON array of ${count} strings
- 150-160 characters each
- Include benefit + CTA, reflect page intent
- Avoid duplicates and boilerplate`;

    const userPrompt = `Context
Summary: ${pageSummary}
Current: ${content.metaDescription || ''}
URL: ${content.url}

Produce ${count} distinct meta descriptions following the rules.`;

    const { text: responseText } = await generateText({
      model: aiOpenAI(OPENAI_MODEL) as any,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
    });
    if (!responseText) throw new Error('No response from AI');
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    let candidates: string[] = [];
    try {
      candidates = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse optimized descriptions list as JSON');
    }

    // Enforce 150-160 and dedupe
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const seen = new Set<string>();
    const filtered = candidates
      .filter((t) => typeof t === 'string')
      .map((t) => t.trim())
      .filter((t) => t.length >= 150 && t.length <= 160)
      .filter((t) => {
        const k = norm(t);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    return filtered.slice(0, count);
  }
} 