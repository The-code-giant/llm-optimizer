import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize OpenAI provider
const aiOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Simplified schema for AI-generated recommendations
const RecommendationSchema = z.object({
  sectionType: z.enum(['title', 'description', 'headings', 'content', 'schema', 'images', 'links']),
  currentScore: z.number().min(0).max(10),
  issues: z.array(z.string()).optional().default([]),
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    category: z.string().optional().default('SEO'),
    title: z.string(),
    description: z.string().optional().default(''),
    expectedImpact: z.number().min(0).max(20).optional().default(2), // Allow up to 20
    implementation: z.string().optional().default('')
  })),
  overallAssessment: z.string().optional().default(''),
  estimatedImprovement: z.number().min(0).max(20).optional().default(2) // Allow up to 20
});

const SectionAnalysisSchema = z.object({
  sections: z.array(RecommendationSchema),
  overallPageAssessment: z.string().optional().default(''),
  criticalIssues: z.array(z.string()).optional().default([]),
  quickWins: z.array(z.string()).optional().default([]),
  longTermStrategy: z.array(z.string()).optional().default([])
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
1. **Deep Content Analysis**: Examine the ACTUAL content provided, not just metrics
2. **Context-Aware Recommendations**: Consider the page's purpose, audience, and industry based on the content
3. **Prioritized Action Items**: Focus on high-impact improvements specific to this content
4. **Specific Implementation Guidance**: Provide clear, actionable steps tailored to this content
5. **Evidence-Based Suggestions**: Base recommendations on the actual content analysis

RECOMMENDATION QUALITY STANDARDS:
- Be specific and actionable for THIS content, not generic
- Provide concrete examples and implementation details based on the actual content
- Consider the user's technical expertise level
- Focus on measurable improvements specific to this page
- Prioritize recommendations by impact and effort required

SCORING CRITERIA:
- 0-3: Poor/Needs major work
- 4-6: Average/Some improvements needed  
- 7-8: Good/Minor optimizations possible
- 9-10: Excellent/Industry best practices

IMPACT SCORING GUIDELINES:
- High-impact recommendations: 3-5 points (major improvements)
- Medium-impact recommendations: 2-3 points (moderate improvements)
- Low-impact recommendations: 1-2 points (minor improvements)
- Total improvements should realistically reach 8-10/10 when all recommendations are implemented

IMPORTANT: Always analyze the ACTUAL content provided and give recommendations specific to that content. Do not give generic advice that could apply to any page.`;

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

    console.log('🤖 AI Agent: Starting page recommendation generation');
    console.log('📄 AI Agent: Page content received:', {
      url: pageContent.url,
      title: pageContent.title,
      titleLength: pageContent.title?.length || 0,
      contentLength: pageContent.bodyText?.length || 0,
      hasKeywords: !!analysisData.keywordAnalysis?.primaryKeywords?.length
    });

    const userPrompt = `Analyze this webpage and provide recommendations for each section.

PAGE CONTENT:
- URL: ${pageContent.url}
- Title: "${pageContent.title || 'No title'}"
- Meta Description: "${pageContent.metaDescription || 'No meta description'}"
- Main Content: ${pageContent.bodyText?.substring(0, 1000) || 'No content'}

ANALYSIS DATA:
- Overall Score: ${analysisData.score}/100
- Keywords: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}

Provide recommendations for each section (title, description, headings, content, schema, images, links) with:
- Current score (0-10)
- 2-3 specific recommendations with titles
- Priority level (low, medium, high)
- Expected impact (1-5 points improvement per recommendation)

IMPORTANT SCORING GUIDELINES:
- Each recommendation should provide 1-5 points of improvement
- Total improvements should be realistic (aim for 8-10/10 total score)
- High-impact recommendations should give 3-5 points
- Medium-impact recommendations should give 2-3 points
- Low-impact recommendations should give 1-2 points

Focus on specific, actionable improvements for this content.`;

    try {
      console.log('🤖 AI Agent: Calling OpenAI API...');
      console.log('🤖 AI Agent: Using model:', OPENAI_MODEL);
      
      const { object: result } = await generateObject({
        model: aiOpenAI(OPENAI_MODEL),
        system: this.SYSTEM_PROMPT,
        schema: SectionAnalysisSchema,
        prompt: userPrompt,
        temperature: 0.1, // Very low temperature for more consistent output
      });

      console.log('🤖 AI Agent: OpenAI API call successful');
      console.log('📊 AI Agent: Generated sections:', result.sections?.length || 0);
      console.log('📊 AI Agent: Result structure:', JSON.stringify(result, null, 2).substring(0, 500) + '...');

      // Post-process the recommendations to ensure realistic impact scores
      const processedResult = this.postProcessRecommendations(result);

      return processedResult as PageAnalysisResult;
    } catch (error) {
      console.error('❌ AI Agent: OpenAI API call failed:', error);
      console.error('❌ AI Agent: Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ AI Agent: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to generate AI recommendations: ${error}`);
    }
  }

  /**
   * Post-process recommendations to ensure realistic impact scores
   */
  private static postProcessRecommendations(result: any): PageAnalysisResult {
    console.log('🔧 Post-processing recommendations for realistic impact scores...');
    
    const processedSections = result.sections.map((section: any) => {
      const currentScore = section.currentScore || 0;
      const recommendations = section.recommendations || [];
      
      // Calculate how many points we need to reach 8-10/10
      const targetScore = 9; // Aim for 9/10
      const neededPoints = Math.max(0, targetScore - currentScore);
      
      // Distribute points among recommendations
      if (recommendations.length > 0 && neededPoints > 0) {
        const processedRecommendations = recommendations.map((rec: any, index: number) => {
          // Assign higher impact to first recommendations
          let impact = 2; // Default
          if (index === 0) impact = 4; // First recommendation gets highest impact
          else if (index === 1) impact = 3; // Second gets medium impact
          else impact = 2; // Others get lower impact
          
          return {
            ...rec,
            expectedImpact: impact
          };
        });
        
        return {
          ...section,
          recommendations: processedRecommendations,
          estimatedImprovement: Math.min(neededPoints, 6)
        };
      }
      
      return section;
    });
    
    console.log('✅ Post-processing complete. Adjusted impact scores for realistic improvements.');
    return {
      ...result,
      sections: processedSections
    };
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
${this.getContentTypeRequirements(contentType)}

IMPORTANT: For titles, generate ONLY the actual title text (50-60 characters), not guides or explanations.`;

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

Generate ${count} distinct, high-quality ${contentType} options that will improve this page's performance.

${contentType === 'title' ? 'IMPORTANT: Generate ONLY the actual title text (50-60 characters), not guides or explanations. Return a simple array of title strings.' : ''}`;

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
      
      // For titles, try to extract just the title strings
      if (contentType === 'title') {
        // Look for patterns like "1. Title", "Title 1:", etc.
        const titleMatches = cleaned.match(/(?:^\d+\.\s*|^[A-Z][^:]*:\s*)([^\n]+)/gm);
        if (titleMatches && titleMatches.length > 0) {
          const titles = titleMatches.map(match => {
            // Extract just the title part after the number/prefix
            const titlePart = match.replace(/^\d+\.\s*|^[A-Z][^:]*:\s*/, '').trim();
            return titlePart;
          }).filter(title => title.length > 0 && title.length <= 70);
          
          if (titles.length > 0) {
            return titles.slice(0, count);
          }
        }
        
        // Fallback: try to parse as JSON array
        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            return parsed.slice(0, count).filter(item => typeof item === 'string' && item.length <= 70);
          }
        } catch {}
        
        // Last fallback: split by newlines and take first few lines
        const lines = cleaned.split('\n').filter(line => line.trim().length > 0 && line.trim().length <= 70);
        return lines.slice(0, count);
      }
      
      // For other content types, use existing logic
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
