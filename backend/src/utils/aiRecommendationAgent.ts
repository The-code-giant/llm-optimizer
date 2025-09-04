import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize OpenAI provider
const aiOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Schema for AI-generated recommendations
const RecommendationSchema = z.object({
  sectionType: z.enum(['title', 'description', 'headings', 'content', 'schema', 'images', 'links']),
  currentScore: z.number().min(0).max(10),
  issues: z.array(z.string()).describe('Specific issues identified in this section'),
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.string().describe('Type of recommendation (e.g., "SEO", "UX", "Technical")'),
    title: z.string().describe('Brief title of the recommendation'),
    description: z.string().describe('Detailed explanation of the recommendation'),
    expectedImpact: z.number().min(0).max(10).describe('Expected score improvement (0-10)'),
    implementation: z.string().describe('How to implement this recommendation'),
    examples: z.array(z.string()).optional().describe('Specific examples or code snippets')
  })),
  overallAssessment: z.string().describe('Overall assessment of this section'),
  estimatedImprovement: z.number().min(0).max(10).describe('Total estimated score improvement if all recommendations are implemented')
});

const SectionAnalysisSchema = z.object({
  sections: z.array(RecommendationSchema),
  overallPageAssessment: z.string().describe('Overall assessment of the entire page'),
  criticalIssues: z.array(z.string()).describe('Critical issues that need immediate attention'),
  quickWins: z.array(z.string()).describe('Easy improvements that can be implemented quickly'),
  longTermStrategy: z.array(z.string()).describe('Long-term strategic improvements')
});

export interface AIRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  expectedImpact: number;
  implementation: string;
  examples?: string[];
}

export interface SectionAnalysis {
  sectionType: 'title' | 'description' | 'headings' | 'content' | 'schema' | 'images' | 'links';
  currentScore: number;
  issues: string[];
  recommendations: AIRecommendation[];
  overallAssessment: string;
  estimatedImprovement: number;
}

export interface PageAnalysisResult {
  sections: SectionAnalysis[];
  overallPageAssessment: string;
  criticalIssues: string[];
  quickWins: string[];
  longTermStrategy: string[];
}

export class AIRecommendationAgent {
  private static readonly SYSTEM_PROMPT = `You are an expert AI content optimization specialist with deep expertise in:
- SEO and search engine optimization
- Generative Engine Optimization (GEO) for LLM citation
- User experience and conversion optimization
- Technical web development and structured data
- Content strategy and marketing

Your task is to analyze web content and provide intelligent, actionable recommendations that will significantly improve the content's performance, search visibility, and user engagement.

ANALYSIS APPROACH:
1. **Deep Content Analysis**: Examine the actual content, not just metrics
2. **Context-Aware Recommendations**: Consider the page's purpose, audience, and industry
3. **Prioritized Action Items**: Focus on high-impact improvements first
4. **Specific Implementation Guidance**: Provide clear, actionable steps
5. **Evidence-Based Suggestions**: Base recommendations on proven optimization techniques

RECOMMENDATION QUALITY STANDARDS:
- Be specific and actionable, not generic
- Provide concrete examples and implementation details
- Consider the user's technical expertise level
- Focus on measurable improvements
- Prioritize recommendations by impact and effort required

SCORING CRITERIA:
- 0-3: Poor/Needs major work
- 4-6: Average/Some improvements needed  
- 7-8: Good/Minor optimizations possible
- 9-10: Excellent/Industry best practices

Always provide honest, constructive feedback that helps users improve their content.`;

  /**
   * Generate AI-powered recommendations for all page sections
   */
  static async generatePageRecommendations(
    pageContent: any,
    analysisData: any,
    pageSummary: string
  ): Promise<PageAnalysisResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const userPrompt = `Analyze this webpage and provide comprehensive, AI-generated recommendations for each section.

PAGE CONTENT:
- URL: ${pageContent.url}
- Title: ${pageContent.title || 'No title'}
- Meta Description: ${pageContent.metaDescription || 'No meta description'}
- Main Content: ${pageContent.bodyText?.substring(0, 2000) || 'No content'}
- Headings: ${pageContent.headings?.join(', ') || 'No headings'}
- Images: ${pageContent.images?.length || 0} images (${pageContent.images?.filter((img: any) => img.alt).length || 0} with alt text)
- Links: ${pageContent.links?.length || 0} internal links
- Schema Markup: ${pageContent.schemaMarkup?.length || 0} schema elements

CURRENT ANALYSIS DATA:
- Overall Score: ${analysisData.score}/100
- Content Quality: Clarity ${analysisData.contentQuality?.clarity || 0}, Structure ${analysisData.contentQuality?.structure || 0}, Completeness ${analysisData.contentQuality?.completeness || 0}
- Technical SEO: Title ${analysisData.technicalSEO?.titleOptimization || 0}, Meta ${analysisData.technicalSEO?.metaDescription || 0}, Headings ${analysisData.technicalSEO?.headingStructure || 0}, Schema ${analysisData.technicalSEO?.schemaMarkup || 0}
- Keywords: Primary [${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}], Long-tail [${analysisData.keywordAnalysis?.longTailKeywords?.slice(0, 3).join(', ') || 'None'}]
- LLM Optimization: FAQs ${analysisData.llmOptimization?.faqsPresent ? 'Present' : 'Missing'}, Definitions ${analysisData.llmOptimization?.definitionsPresent ? 'Present' : 'Missing'}, Structured Data ${analysisData.llmOptimization?.structuredData ? 'Present' : 'Missing'}

PAGE SUMMARY:
${pageSummary}

ANALYSIS REQUIREMENTS:
1. **Section-by-Section Analysis**: Analyze each section (title, description, headings, content, schema, images, links) individually
2. **Current Score Assessment**: Provide honest scoring (0-10) for each section based on industry standards
3. **Issue Identification**: Identify specific, concrete issues in each section
4. **Prioritized Recommendations**: Provide 3-5 high-impact recommendations per section, prioritized by impact
5. **Implementation Guidance**: Include specific steps, examples, and code snippets where applicable
6. **Impact Estimation**: Estimate the score improvement each recommendation would provide

FOCUS AREAS:
- SEO optimization and keyword integration
- User experience and engagement
- Technical implementation and structured data
- Content quality and comprehensiveness
- LLM optimization for AI citation
- Conversion optimization and call-to-actions

Provide recommendations that are:
- Specific and actionable (not generic advice)
- Tailored to this specific content and industry
- Prioritized by impact and implementation difficulty
- Include concrete examples and implementation steps
- Consider both immediate wins and long-term strategy`;

    try {
      const { object: result } = await generateObject({
        model: aiOpenAI(OPENAI_MODEL),
        system: this.SYSTEM_PROMPT,
        schema: SectionAnalysisSchema,
        prompt: userPrompt,
        temperature: 0.3, // Lower temperature for more consistent analysis
      });

      return result as PageAnalysisResult;
    } catch (error) {
      console.error('❌ AI recommendation generation failed:', error);
      throw new Error(`Failed to generate AI recommendations: ${error}`);
    }
  }

  /**
   * Generate recommendations for a specific section
   */
  static async generateSectionRecommendations(
    sectionType: string,
    pageContent: any,
    analysisData: any,
    currentContent: string,
    additionalContext: string = ''
  ): Promise<SectionAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const userPrompt = `Analyze the ${sectionType} section of this webpage and provide detailed recommendations.

SECTION TYPE: ${sectionType.toUpperCase()}

CURRENT ${sectionType.toUpperCase()} CONTENT:
${currentContent || 'No current content provided'}

PAGE CONTEXT:
- URL: ${pageContent.url}
- Page Title: ${pageContent.title || 'No title'}
- Meta Description: ${pageContent.metaDescription || 'No meta description'}
- Main Content: ${pageContent.bodyText?.substring(0, 1000) || 'No content'}

ANALYSIS DATA:
- Overall Score: ${analysisData.score}/100
- Primary Keywords: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}
- Long-tail Keywords: ${analysisData.keywordAnalysis?.longTailKeywords?.slice(0, 3).join(', ') || 'None'}

ADDITIONAL CONTEXT:
${additionalContext || 'No additional context provided'}

REQUIREMENTS:
1. **Score Assessment**: Provide honest current score (0-10) for this section
2. **Issue Identification**: Identify 3-5 specific issues with this section
3. **Recommendations**: Provide 3-5 prioritized recommendations with:
   - Priority level (low/medium/high/critical)
   - Category (SEO/UX/Technical/Content)
   - Clear title and description
   - Expected impact score (0-10 improvement)
   - Specific implementation steps
   - Examples or code snippets where applicable
4. **Overall Assessment**: Brief summary of this section's current state
5. **Estimated Improvement**: Total score improvement if all recommendations are implemented

Focus on actionable, specific improvements that will have measurable impact on this section's performance.`;

    try {
      const { object: result } = await generateObject({
        model: aiOpenAI(OPENAI_MODEL),
        system: this.SYSTEM_PROMPT,
        schema: RecommendationSchema,
        prompt: userPrompt,
        temperature: 0.3,
      });

      return result as SectionAnalysis;
    } catch (error) {
      console.error(`❌ AI section recommendation generation failed for ${sectionType}:`, error);
      throw new Error(`Failed to generate AI recommendations for ${sectionType}: ${error}`);
    }
  }

  /**
   * Generate content suggestions based on AI analysis
   */
  static async generateContentSuggestions(
    contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords' | 'schema',
    pageContent: any,
    analysisData: any,
    pageSummary: string,
    count: number = 3
  ): Promise<any> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert content strategist specializing in ${contentType} optimization for SEO and LLM citation.

Your task is to generate high-quality, optimized ${contentType} suggestions that will improve the page's performance and search visibility.

QUALITY STANDARDS:
- Generate content that is specific, actionable, and tailored to the page
- Optimize for both search engines and AI citation
- Include relevant keywords naturally
- Follow best practices for ${contentType} optimization
- Provide ${count} distinct, high-quality options

CONTENT REQUIREMENTS:
${this.getContentTypeRequirements(contentType)}`;

    const userPrompt = `Generate ${count} optimized ${contentType} suggestions for this webpage:

PAGE DETAILS:
- URL: ${pageContent.url}
- Current Title: ${pageContent.title || 'No title'}
- Current Meta Description: ${pageContent.metaDescription || 'No meta description'}
- Main Content: ${pageContent.bodyText?.substring(0, 1500) || 'No content'}

ANALYSIS INSIGHTS:
- Overall Score: ${analysisData.score}/100
- Primary Keywords: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}
- Long-tail Keywords: ${analysisData.keywordAnalysis?.longTailKeywords?.slice(0, 3).join(', ') || 'None'}
- Missing Keywords: ${analysisData.keywordAnalysis?.missingKeywords?.slice(0, 3).join(', ') || 'None'}

PAGE SUMMARY:
${pageSummary}

Generate ${count} distinct, high-quality ${contentType} options that will improve this page's performance.`;

    try {
      const { text: responseText } = await generateText({
        model: aiOpenAI(OPENAI_MODEL) as any,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
      });

      if (!responseText) throw new Error('No response from AI');

      // Parse the response based on content type
      return this.parseContentResponse(responseText, contentType, count);
    } catch (error) {
      console.error(`❌ AI content generation failed for ${contentType}:`, error);
      throw new Error(`Failed to generate ${contentType} content: ${error}`);
    }
  }

  /**
   * Get content type specific requirements
   */
  private static getContentTypeRequirements(contentType: string): string {
    switch (contentType) {
      case 'title':
        return '- Length: 50-60 characters\n- Include primary keywords\n- Be compelling and click-worthy\n- Avoid generic phrases';
      case 'description':
        return '- Length: 150-160 characters\n- Include call-to-action\n- Mention key benefits\n- Include relevant keywords';
      case 'faq':
        return '- Address common user questions\n- Provide comprehensive answers\n- Include relevant keywords\n- Be helpful and informative';
      case 'paragraph':
        return '- 100-150 words each\n- Include action-oriented headings\n- Provide valuable information\n- Optimize for readability';
      case 'keywords':
        return '- Include primary, long-tail, and semantic keywords\n- Organize by category\n- Provide search volume insights\n- Include related terms';
      case 'schema':
        return '- Generate valid JSON-LD markup\n- Use real URLs and accurate data\n- Include appropriate schema types\n- Follow schema.org standards';
      default:
        return '- High-quality, optimized content\n- Relevant to the page topic\n- Include appropriate keywords';
    }
  }

  /**
   * Parse AI response based on content type
   */
  private static parseContentResponse(responseText: string, contentType: string, count: number): any {
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        return parsed.slice(0, count);
      } else if (typeof parsed === 'object') {
        // Handle object responses (like keywords with categories)
        return parsed;
      } else {
        // Handle string responses
        return [parsed];
      }
    } catch (error) {
      console.error(`Failed to parse ${contentType} response:`, responseText);
      // Fallback: return the raw text as a single suggestion
      return [responseText.trim()];
    }
  }
}
