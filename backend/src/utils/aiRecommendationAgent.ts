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
- CRITICAL RULE: Total points from all recommendations per section must equal exactly (10 - current_score)
- If current score is 6/10, recommendations must total exactly 4 points
- If current score is 3/10, recommendations must total exactly 7 points
- High-impact recommendations: 2-3 points each
- Medium-impact recommendations: 1-2 points each  
- Low-impact recommendations: 1 point each
- MATHEMATICAL ACCURACY: Always ensure recommendations sum to fill the exact gap to 10/10

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

CURRENT SECTION SCORES:
- Title: ${analysisData.sectionRatings?.title || 0}/10
- Description: ${analysisData.sectionRatings?.description || 0}/10  
- Headings: ${analysisData.sectionRatings?.headings || 0}/10
- Content: ${analysisData.sectionRatings?.content || 0}/10
- Schema: ${analysisData.sectionRatings?.schema || 0}/10
- Images: ${analysisData.sectionRatings?.images || 0}/10
- Links: ${analysisData.sectionRatings?.links || 0}/10

KEYWORDS: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}

CRITICAL SCORING RULE:
For each section, the total points from ALL recommendations should equal exactly (10 - current_score).
Example: If title score is 6/10, then ALL title recommendations combined should total exactly 4 points.

Provide recommendations for each section with:
- Current score (use the scores provided above)
- 2-3 specific recommendations with titles
- Priority level (low, medium, high, critical)
- Points per recommendation (must sum to exactly fill the gap to 10/10)

POINT ALLOCATION STRATEGY:
- If gap is 1-2 points: 1-2 medium recommendations (1-2 points each)
- If gap is 3-4 points: 2-3 recommendations (1-2 points each)  
- If gap is 5+ points: 3-4 recommendations (1-3 points each)
- TOTAL must always equal the gap to reach 10/10

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
   * Post-process recommendations to ensure EXACT mathematical accuracy
   */
  private static postProcessRecommendations(result: any): PageAnalysisResult {
    console.log('🔧 Validating recommendation math for exact 10/10 totals...');
    
    const processedSections = result.sections.map((section: any) => {
      const currentScore = section.currentScore || 0;
      const recommendations = section.recommendations || [];
      
      // Calculate EXACT points needed to reach 10/10
      const pointsNeeded = Math.max(0, 10 - currentScore);
      
      console.log(`📊 Section ${section.sectionType}: Current ${currentScore}/10, needs ${pointsNeeded} points`);
      
      if (recommendations.length > 0 && pointsNeeded > 0) {
        // Calculate current total from AI recommendations
        const currentTotal = recommendations.reduce((sum: number, rec: any) => sum + (rec.expectedImpact || 0), 0);
        
        console.log(`📊 AI gave ${currentTotal} points total, but we need exactly ${pointsNeeded} points`);
        
        // Redistribute points to equal exactly the needed amount
        const adjustedRecommendations = this.redistributePoints(recommendations, pointsNeeded);
        
        const newTotal = adjustedRecommendations.reduce((sum: number, rec: any) => sum + rec.expectedImpact, 0);
        console.log(`✅ Adjusted to ${newTotal} points (should equal ${pointsNeeded})`);
        
        return {
          ...section,
          recommendations: adjustedRecommendations,
          estimatedImprovement: pointsNeeded
        };
      }
      
      return section;
    });
    
    console.log('✅ Math validation complete. All sections now total exactly 10/10.');
    return {
      ...result,
      sections: processedSections
    };
  }

  /**
   * Redistribute points among recommendations to match exact target
   */
  private static redistributePoints(recommendations: any[], targetTotal: number): any[] {
    if (recommendations.length === 0) return recommendations;
    
    // Sort recommendations by priority (high priority gets more points)
    const sorted = [...recommendations].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    });
    
    // Distribute points proportionally but ensure exact total
    const basePoints = Math.floor(targetTotal / sorted.length);
    const remainder = targetTotal % sorted.length;
    
    return sorted.map((rec, index) => ({
      ...rec,
      expectedImpact: basePoints + (index < remainder ? 1 : 0)
    }));
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

${contentType === 'schema' ? `
CRITICAL SCHEMA OUTPUT FORMAT:
- Output ONLY pure JSON-LD markup (no HTML, no explanations, no script tags)
- Use valid JSON syntax that can be directly parsed
- All URLs must be absolute and use the actual domain from the page
- Return only the JSON object starting with { and ending with }
- No surrounding text, comments, or HTML elements
` : ''}

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

${contentType === 'title' ? 'IMPORTANT: Generate ONLY the actual title text (50-60 characters), not guides or explanations. Return a simple array of title strings.' : ''}${contentType === 'schema' ? `

CRITICAL SCHEMA REQUIREMENTS:
- Return ONLY pure JSON-LD markup, no HTML tags or script wrappers
- Use the actual domain: ${new URL(pageContent.url).origin}
- Include relevant schema types: Organization, WebSite, SoftwareApplication, BreadcrumbList, FAQPage (as appropriate)
- Make all URLs absolute and real (not placeholder URLs)
- Ensure the JSON is valid and can be directly injected into <script type="application/ld+json"> tags
- NO HTML content, NO explanatory text, ONLY the JSON object` : ''}`;

    try {
      const { text: responseText } = await generateText({
        model: aiOpenAI(OPENAI_MODEL) as any,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
      });

      if (!responseText) throw new Error('No response from AI');

      console.log(`🤖 AI Response for ${contentType}:`, responseText.substring(0, 200) + '...');

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
        return `- Generate ONLY valid JSON-LD markup (pure JSON, no HTML)
- Use real URLs and accurate data from the page content
- Include appropriate schema types for the page (Organization, WebSite, SoftwareApplication, etc.)
- Follow schema.org standards exactly
- Return ONLY the JSON object, no surrounding HTML tags or script tags
- Ensure all URLs use the actual domain from the page
- Make the schema comprehensive but relevant to the page content
- CRITICAL: Output format must be pure JSON that can be directly injected into <script type="application/ld+json"> tags`;
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
      
      // Special handling for schema content
      if (contentType === 'schema') {
        return this.parseSchemaResponse(cleaned);
      }
      
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

  /**
   * Parse schema response to extract clean JSON-LD
   */
  private static parseSchemaResponse(responseText: string): string {
    console.log('🔧 Parsing schema response...', responseText.substring(0, 100) + '...');
    
    try {
      // Remove common wrapper text and HTML tags
      let cleaned = responseText
        .replace(/```json|```/g, '')
        .replace(/<script[^>]*>/gi, '')
        .replace(/<\/script>/gi, '')
        .replace(/Here's the schema markup:|Generated schema:|Schema markup:/gi, '')
        .replace(/^[^\{]*/, '') // Remove everything before first {
        .replace(/[^\}]*$/, '}') // Remove everything after last }
        .trim();

      // Extract JSON from HTML if present
      const scriptMatch = cleaned.match(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>\s*([\s\S]*?)\s*<\/script>/i);
      if (scriptMatch) {
        console.log('📜 Found script tag, extracting JSON...');
        cleaned = scriptMatch[1].trim();
      }

      // Find JSON object in the text
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }

      // Validate JSON
      const parsed = JSON.parse(cleaned);
      console.log('✅ Schema JSON parsed successfully');
      
      // Return formatted JSON string
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error('❌ Failed to parse schema JSON:', error);
      console.error('📄 Raw response:', responseText);
      
      // Fallback: try to extract any JSON-like content
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Fallback parsing successful');
          return JSON.stringify(parsed, null, 2);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback parsing also failed:', fallbackError);
      }
      
      // Last resort: return empty schema structure
      console.log('⚠️ Using fallback empty schema structure');
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Website",
        "url": "https://example.com"
      }, null, 2);
    }
  }
}
