import OpenAI from 'openai';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { db } from '../db/client';
import { contentSuggestions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    // Only translate in development mode and for Docker containers
    if (process.env.NODE_ENV !== 'development') {
      return url;
    }

    // Parse URL to understand what we're dealing with
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      // If URL is invalid, return as-is
      return url;
    }

    // Only translate localhost URLs that we know are our internal services
    if (parsedUrl.hostname === 'localhost') {
      switch (parsedUrl.port) {
        case '3000':
          // This is our frontend service
          console.log(`🔄 Translating frontend URL: ${url} -> Docker service`);
          return url.replace('localhost:3000', 'cleaver-search-frontend:3000');
        
        case '3001':
          // This is our backend service (shouldn't normally happen, but just in case)
          console.log(`🔄 Translating backend URL: ${url} -> Docker service`);
          return url.replace('localhost:3001', 'cleaver-search-backend:3001');
        
        default:
          // Other localhost ports - use host.docker.internal to access host machine
          console.log(`🔄 Translating external localhost URL: ${url} -> host machine access`);
          return url.replace('localhost', 'host.docker.internal');
      }
    }

    // For all other URLs (internet URLs, other local IPs, etc.), return unchanged
    console.log(`🌐 Using external URL as-is: ${url}`);
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
          'User-Agent': 'Cleaver-Search-Bot/1.0 (+https://cleaversearch.com)',
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using cost-effective model
        messages: [
          {
            role: 'system',
            content: this.ANALYSIS_PROMPT
          },
          {
            role: 'user',
            content: contentForAnalysis
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      let parsedResult;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        parsedResult = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', responseText);
        throw new Error('Failed to parse analysis results');
      }

      // Map to our AnalysisResult interface
      const result: AnalysisResult = {
        score: parsedResult.overallScore || 0,
        summary: parsedResult.summary || 'Analysis completed',
        issues: parsedResult.issues || [],
        recommendations: parsedResult.recommendations || [],
        contentQuality: {
          clarity: parsedResult.contentQuality?.clarity || 0,
          structure: parsedResult.contentQuality?.structure || 0,
          completeness: parsedResult.contentQuality?.completeness || 0,
        },
        technicalSEO: {
          headingStructure: parsedResult.technicalSEO?.headingStructure || 0,
          semanticMarkup: parsedResult.technicalSEO?.semanticMarkup || 0,
          contentDepth: parsedResult.technicalSEO?.contentDepth || 0,
          titleOptimization: parsedResult.technicalSEO?.titleOptimization || 0,
          metaDescription: parsedResult.technicalSEO?.metaDescription || 0,
          schemaMarkup: parsedResult.technicalSEO?.schemaMarkup || 0,
        },
        keywordAnalysis: {
          primaryKeywords: parsedResult.keywordAnalysis?.primaryKeywords || [],
          longTailKeywords: parsedResult.keywordAnalysis?.longTailKeywords || [],
          keywordDensity: parsedResult.keywordAnalysis?.keywordDensity || 0,
          semanticKeywords: parsedResult.keywordAnalysis?.semanticKeywords || [],
          missingKeywords: parsedResult.keywordAnalysis?.missingKeywords || [],
        },
        llmOptimization: {
          definitionsPresent: parsedResult.llmOptimization?.definitionsPresent || false,
          faqsPresent: parsedResult.llmOptimization?.faqsPresent || false,
          structuredData: parsedResult.llmOptimization?.structuredData || false,
          citationFriendly: parsedResult.llmOptimization?.citationFriendly || false,
          topicCoverage: parsedResult.llmOptimization?.topicCoverage || 0,
          answerableQuestions: parsedResult.llmOptimization?.answerableQuestions || 0,
        }
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
      { type: 'title', maxTokens: 200 },
      { type: 'description', maxTokens: 200 },
      { type: 'faq', maxTokens: 800 },
      { type: 'paragraph', maxTokens: 500 },
      { type: 'keywords', maxTokens: 300 }
    ];

    for (const { type, maxTokens } of contentTypes) {
      try {
        const suggestions = await this.generateSpecificContentType(type as any, content, analysisResult, maxTokens, analysisResult.pageSummary);

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

        console.log(`✅ Generated ${type} suggestions for page ${pageId}`);
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content analyst. Provide clear, comprehensive summaries that capture the essence and purpose of web content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 600,
      });

      const summary = completion.choices[0]?.message?.content?.trim();
      return summary || 'Unable to generate page summary';
    } catch (error) {
      console.error('❌ Failed to generate page summary:', error);
      return 'Page summary generation failed';
    }
  }

  /**
   * Generate specific content type suggestions
   */
  private static async generateSpecificContentType(
    contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords',
    content: PageContent,
    analysisResult: AnalysisResult,
    maxTokens: number,
    pageSummary?: string
  ): Promise<any> {
    let prompt = '';

    const contextInfo = `
URL: ${content.url}
Current Title: ${content.title || 'No title'}
Current Meta Description: ${content.metaDescription || 'No meta description'}
Keywords Found: ${analysisResult.keywordAnalysis.primaryKeywords.join(', ')}
Long-tail Keywords: ${analysisResult.keywordAnalysis.longTailKeywords.join(', ')}
Missing Keywords: ${analysisResult.keywordAnalysis.missingKeywords.join(', ')}
Content Summary: ${analysisResult.summary}
${pageSummary ? `

Page Context & Summary:
${pageSummary}` : ''}
`;

    switch (contentType) {
      case 'title':
        prompt = `Generate 5 SEO-optimized page titles for this webpage:

${contextInfo}

Requirements:
- 50-60 characters optimal length
- Include primary keywords naturally
- Make it compelling and click-worthy
- Focus on user intent and value proposition
- Consider long-tail keyword opportunities

Return ONLY a JSON array of 5 title suggestions:
["title 1", "title 2", "title 3", "title 4", "title 5"]`;
        break;

      case 'description':
        prompt = `Generate 3 SEO-optimized meta descriptions for this webpage:

${contextInfo}

Requirements:
- 150-160 characters optimal length
- Include primary keywords naturally
- Compelling call-to-action
- Describe the page value clearly
- Match search intent

Return ONLY a JSON array of 3 descriptions:
["description 1", "description 2", "description 3"]`;
        break;

      case 'faq':
        prompt = `Generate a comprehensive FAQ section for this webpage:

${contextInfo}

Generate 6-8 relevant questions and detailed answers that:
- Address common user queries about this topic
- Include naturally integrated keywords
- Provide comprehensive, helpful answers
- Are structured for LLM understanding
- Focus on user intent and value

Return ONLY a JSON array of FAQ objects:
[
  {
    "question": "Question 1?",
    "answer": "Detailed answer..."
  },
  {
    "question": "Question 2?",
    "answer": "Detailed answer..."
  }
]`;
        break;

      case 'paragraph':
        prompt = `Generate 3 optimized content paragraphs for this webpage:

${contextInfo}

Generate paragraphs that:
- Are 100-150 words each
- Include relevant keywords naturally
- Provide valuable, actionable information
- Are structured for LLM understanding
- Address user search intent

Return ONLY a JSON array of 3 paragraphs:
["paragraph 1 content...", "paragraph 2 content...", "paragraph 3 content..."]`;
        break;

      case 'keywords':
        prompt = `Generate comprehensive keyword analysis for this webpage:

${contextInfo}

Generate:
- 5-7 primary keywords (main topics)
- 8-10 long-tail keyword phrases (4+ words)
- 5-7 semantic/LSI keywords
- 3-5 missing keyword opportunities

Return ONLY a JSON object:
{
  "primary": ["keyword1", "keyword2"],
  "longTail": ["long tail phrase 1", "specific query phrase 2"],
  "semantic": ["related term 1", "synonym 2"],
  "missing": ["opportunity 1", "gap 2"]
}`;
        break;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist and SEO specialist. Generate high-quality, optimized content that helps pages rank better and get cited by LLMs. Always return valid JSON as requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('Failed to parse content suggestions');
    }
  }
} 