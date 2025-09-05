import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize OpenAI provider
const aiOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Use a flexible schema that works with AI SDK
const SectionAnalysisSchema = z.object({
  sections: z.array(z.record(z.any())).describe("Array of section objects"),
  overallPageAssessment: z.string(),
  criticalIssues: z.array(z.string()),
  quickWins: z.array(z.string()),
  longTermStrategy: z.array(z.string())
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
  private static readonly SYSTEM_PROMPT = `You are an expert content & GEO (Generative Engine Optimization) specialist. Your output must be a single JSON object that exactly matches the expected schema.

CRITICAL SCHEMA REQUIREMENTS:
- sectionType: Must be one of: "title", "description", "headings", "content", "schema", "images", "links"
- priority: Must be one of: "low", "medium", "high", "critical"
- currentScore: Integer between 0-10
- expectedImpact: Integer between 0-10
- estimatedImprovement: Integer between 0-10

OUTPUT FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "sections": [
    {
      "sectionType": "title",
      "currentScore": 7,
      "issues": ["issue1", "issue2", "issue3"],
      "recommendations": [
        {
          "priority": "high",
          "category": "SEO",
          "title": "Fix Title Length",
          "description": "Title is too long for optimal SEO",
          "expectedImpact": 3,
          "implementation": "Reduce title to 60 characters"
        }
      ],
      "overallAssessment": "Brief assessment",
      "estimatedImprovement": 3
    }
  ],
  "overallPageAssessment": "Overall page assessment",
  "criticalIssues": ["critical issue 1"],
  "quickWins": ["quick win 1"],
  "longTermStrategy": ["strategy 1"]
}

RULES:
1) Generate exactly 7 sections (one for each sectionType)
2) Keep descriptions <= 50 words, titles <= 12 words
3) For each section: sum of expectedImpact + currentScore must equal 10
4) estimatedImprovement = sum of expectedImpact for that section
5) AI decides how many recommendations (1-5) based on section needs
6) AI decides how many issues (1-5) based on section problems found
7) Points are distributed among recommendations dynamically
8) NO extra text, comments, or markdown formatting
9) If insufficient content, return minimal valid JSON with empty arrays

FAILURE TO FOLLOW SCHEMA WILL RESULT IN ERROR.`;

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

    const userPrompt = `Analyze this webpage and return a JSON object matching the SectionAnalysis schema.

PAGE DATA:
- URL: ${pageContent.url}
- Title: "${pageContent.title || 'No title'}"
- Meta Description: "${pageContent.metaDescription || 'No meta description'}"
- Body Text: "${pageContent.bodyText?.substring(0, 1000) || 'No content'}"

CURRENT SCORES:
- Title: ${analysisData.sectionRatings?.title || 0}/10
- Description: ${analysisData.sectionRatings?.description || 0}/10
- Headings: ${analysisData.sectionRatings?.headings || 0}/10
- Content: ${analysisData.sectionRatings?.content || 0}/10
- Schema: ${analysisData.sectionRatings?.schema || 0}/10
- Images: ${analysisData.sectionRatings?.images || 0}/10
- Links: ${analysisData.sectionRatings?.links || 0}/10

KEYWORDS: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}

REQUIREMENTS:
- Generate exactly 7 sections (title, description, headings, content, schema, images, links)
- Each section needs: currentScore (0-10), issues (1-5 items), recommendations (1-5 items), estimatedImprovement
- Each recommendation needs: priority (low/medium/high/critical), title, description, expectedImpact (0-10), implementation
- IMPORTANT: For each section, currentScore + sum(expectedImpact) must equal exactly 10
- AI decides how many recommendations and issues based on section needs
- Return ONLY the JSON object, no other text.`;

    try {
      console.log('🤖 AI Agent: Calling OpenAI API...');
      console.log('🤖 AI Agent: Using model:', OPENAI_MODEL);
      
      // Try with retry logic for schema validation errors
      let result;
      let attempts = 0;
      const maxAttempts = 1;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`🤖 AI Agent: Attempt ${attempts}/${maxAttempts}`);
          
          const response = await generateObject({
            model: aiOpenAI(OPENAI_MODEL),
            system: this.SYSTEM_PROMPT,
            schema: SectionAnalysisSchema,
            prompt: userPrompt,
            temperature: 0.3, // Increased temperature for better JSON generation
          });
          
          result = response.object;
          console.log('🤖 AI Agent: OpenAI API call successful');
          
          // Manual validation of the response structure
          if (!result.sections || !Array.isArray(result.sections)) {
            throw new Error('Invalid response: missing or invalid sections array');
          }
          
          // Validate each section has required fields
          for (const section of result.sections) {
            if (!section.sectionType || typeof section.currentScore !== 'number' || !section.recommendations) {
              throw new Error(`Invalid section: missing required fields`);
            }
          }
          
          break;
        } catch (schemaError) {
          console.error(`❌ AI Agent: Schema validation failed on attempt ${attempts}:`, schemaError);
          
          if (attempts === maxAttempts) {
            console.log('🔄 AI Agent: All attempts failed, falling back to simplified generation...');
            return this.generateFallbackRecommendations(pageContent, analysisData);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      console.log('📊 AI Agent: Generated sections:', result.sections?.length || 0);
      console.log('📊 AI Agent: Result structure:', JSON.stringify(result, null, 2).substring(0, 500) + '...');

      // Post-process the recommendations to ensure realistic impact scores
      const processedResult = this.postProcessRecommendations(result);

      return processedResult as PageAnalysisResult;
    } catch (error) {
      console.error('❌ AI Agent: OpenAI API call failed:', error);
      console.error('❌ AI Agent: Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ AI Agent: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Fallback to basic recommendations if all else fails
      console.log('🔄 AI Agent: Falling back to basic recommendations...');
      return this.generateFallbackRecommendations(pageContent, analysisData);
    }
  }

  /**
   * Generate fallback recommendations when AI generation fails
   */
  private static generateFallbackRecommendations(pageContent: any, analysisData: any): PageAnalysisResult {
    console.log('🔄 Generating fallback recommendations...');
    
    const sections = [
      'title', 'description', 'headings', 'content', 'schema', 'images', 'links'
    ].map(sectionType => {
      const currentScore = analysisData.sectionRatings?.[sectionType] || 5;
      const pointsNeeded = Math.max(0, 10 - currentScore);
      
      // Generate 1-3 recommendations based on how many points are needed
      const recommendationCount = Math.min(Math.max(1, Math.ceil(pointsNeeded / 3)), 3);
      const pointsPerRec = Math.floor(pointsNeeded / recommendationCount);
      const remainder = pointsNeeded % recommendationCount;
      
      const recommendations = Array.from({ length: recommendationCount }, (_, i) => ({
        priority: i === 0 ? 'high' as const : 'medium' as const,
        category: 'SEO',
        title: `Improve ${sectionType} ${i + 1}`,
        description: `Enhance ${sectionType} for better SEO performance`,
        expectedImpact: pointsPerRec + (i < remainder ? 1 : 0),
        implementation: `Review and optimize ${sectionType}`
      }));
      
      return {
        sectionType: sectionType as any,
        currentScore,
        issues: [`${sectionType} needs improvement`],
        recommendations,
        overallAssessment: `${sectionType} section needs optimization`,
        estimatedImprovement: pointsNeeded
      };
    });

    return {
      sections,
      overallPageAssessment: 'Page needs optimization across multiple sections',
      criticalIssues: ['Multiple sections need improvement'],
      quickWins: ['Optimize meta tags', 'Improve content structure'],
      longTermStrategy: ['Develop comprehensive SEO strategy']
    };
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
      console.log(`📊 AI provided ${recommendations.length} recommendations`);
      
      if (recommendations.length > 0 && pointsNeeded > 0) {
        // Calculate current total from AI recommendations
        const currentTotal = recommendations.reduce((sum: number, rec: any) => sum + (rec.expectedImpact || 0), 0) as number;
        
        console.log(`📊 AI gave ${currentTotal} points total, but we need exactly ${pointsNeeded} points`);
        
        // Redistribute points to equal exactly the needed amount
        const adjustedRecommendations = this.redistributePoints(recommendations, pointsNeeded);
        
        const newTotal = adjustedRecommendations.reduce((sum: number, rec: any) => sum + rec.expectedImpact, 0);
        console.log(`✅ Adjusted to ${newTotal} points (should equal ${pointsNeeded})`);
        console.log(`📊 Final recommendation distribution:`, adjustedRecommendations.map((r: any) => `${r.title}: ${r.expectedImpact} points`));
        
        return {
          ...section,
          recommendations: adjustedRecommendations,
          estimatedImprovement: pointsNeeded
        };
      } else if (recommendations.length === 0 && pointsNeeded > 0) {
        console.log(`⚠️ No recommendations provided for ${section.sectionType}, but ${pointsNeeded} points needed`);
        // Add a generic recommendation if none provided
        return {
          ...section,
          recommendations: [{
            priority: 'medium',
            category: 'SEO',
            title: `Improve ${section.sectionType}`,
            description: `${section.sectionType} section needs optimization`,
            expectedImpact: pointsNeeded,
            implementation: `Review and optimize ${section.sectionType}`
          }],
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
    
    console.log(`🔄 Redistributing ${targetTotal} points among ${recommendations.length} recommendations`);
    
    // Sort recommendations by priority (high priority gets more points)
    const sorted = [...recommendations].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    });
    
    // Distribute points proportionally but ensure exact total
    const basePoints = Math.floor(targetTotal / sorted.length);
    const remainder = targetTotal % sorted.length;
    
    const result = sorted.map((rec, index) => ({
      ...rec,
      expectedImpact: basePoints + (index < remainder ? 1 : 0)
    }));
    
    console.log(`📊 Point distribution:`, result.map((r, i) => `${r.title}: ${r.expectedImpact} points (${r.priority})`));
    
    return result;
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

  const userPrompt = `Focus on the ${sectionType} section. Use only the provided content and return a single JSON object.

SECTION CONTENT:
"""
${currentContent || 'No current content provided'}
"""

PAGE CONTEXT:
- URL: ${pageContent.url}
- Page Title: "${pageContent.title || 'No title'}"
- Keywords: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}

REQUEST:
1) currentScore: 0-10
2) issues: list 1-5 items based on problems found (with evidence excerpts <=140 chars)
3) recommendations: 1-5 items with {title, description <=50 words, implementation (<=3 steps), expectedImpact (int), priority, category}
4) IMPORTANT: currentScore + sum(expectedImpact) must equal exactly 10
5) estimatedImprovement: sum(expectedImpact)

Output exactly the JSON object only.`;

    try {
      const { object: result } = await generateObject({
        model: aiOpenAI(OPENAI_MODEL),
        system: this.SYSTEM_PROMPT,
        schema: z.object({
          sectionType: z.string(),
          currentScore: z.number(),
          issues: z.array(z.string()),
          recommendations: z.array(z.object({
            priority: z.string(),
            category: z.string(),
            title: z.string(),
            description: z.string(),
            expectedImpact: z.number(),
            implementation: z.string()
          })),
          overallAssessment: z.string(),
          estimatedImprovement: z.number()
        }),
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
    console.log(`🤖 AI Content Suggestion: Generating ${count} ${contentType}(s) for ${pageContent.url}${pageSummary}`);
  // Derive a brand hint to ensure titles stay on-brand
  const brandHint = pageContent.brand || 
                   pageContent.siteName || 
                   (pageContent.title ? pageContent.title.split(' - ').slice(-1)[0].trim() : 
                   (pageContent.url && pageContent.url.trim() ? new URL(pageContent.url).hostname : 'website'));
  
  // Choose temperature: deterministic for titles to avoid off-brand creativity
  const temperatureSetting = contentType === 'title' ? 0.0 : 0.7;

  const systemPrompt = `You are an expert content strategist. Output must be concise, JSON-only, and optimized for GEO (LLM citation).

Focus: ${contentType}

Rules:
- Generate ${count} distinct, high-quality options.
- Keep items directly usable (titles 50-60 chars; descriptions 150-160 chars).
- Follow content-type requirements:
${this.getContentTypeRequirements(contentType)}

If contentType is 'schema', output only a single pure JSON-LD object (no wrappers, no commentary).

${contentType === 'title' ? `For titles: MUST include the brand token '${brandHint}' (if present) and at least one primary keyword from the provided keywords. Titles must be strictly relevant to the page content and brand; avoid unrelated or promotional language.` : ''}`;

  const userPrompt = `Generate ${count} ${contentType} options for this page using only the provided content. Return JSON only.

PAGE:
- URL: ${pageContent.url}
- Title: "${pageContent.title || 'No title'}"
- Meta: "${pageContent.metaDescription || 'No meta description'}"
- Body (first 1500 chars): """${pageContent.bodyText?.substring(0,1500) || 'No content'}"""

ANALYSIS:
- Overall Score: ${analysisData.score}/100
- Primary Keywords: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}
- Missing Keywords: ${analysisData.keywordAnalysis?.missingKeywords?.slice(0,3).join(', ') || 'None'}

Requirements:
 - For titles: return an array of ${count} title strings (50-60 chars) only. Each title MUST include the brand token '${brandHint}' (if present) and at least one primary keyword from: ${analysisData.keywordAnalysis?.primaryKeywords?.join(', ') || 'None'}. If the page content lacks keywords or brand info, produce conservative options that explicitly reference a clear phrase from the page content.
- For schema: return one pure JSON-LD object using domain ${new URL(pageContent.url).origin}. Include a sourceEvidence array when facts are used.
- For other types: return JSON array/object directly parseable by the existing parser.`;

    try {
    

      const { text: responseText } = await generateText({
        model: aiOpenAI(OPENAI_MODEL) as any,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: temperatureSetting,
      });

      if (!responseText) throw new Error('No response from AI');

      console.log(`🤖 AI Response for ${contentType}:`, responseText.substring(0, 200) + '...');

      // Parse the response based on content type
      const parsed = this.parseContentResponse(responseText, contentType, count);

      // Post-process titles to ensure brand/keyword relevance
      if (contentType === 'title') {
        const validated = this.ensureTitlesOnBrand(parsed, brandHint, analysisData, count);
        return validated;
      }

      return parsed;
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
   * Ensure titles include brand or primary keywords; minimally fix or filter unrelated titles.
   */
  private static ensureTitlesOnBrand(titles: string[] | any, brandHint: string, analysisData: any, count: number): string[] {
    if (!Array.isArray(titles)) return titles;

    const primaryKeywords: string[] = (analysisData?.keywordAnalysis?.primaryKeywords) || [];

    const containsKeywordOrBrand = (title: string) => {
      const lower = title.toLowerCase();
      if (brandHint && lower.includes(brandHint.toLowerCase())) return true;
      for (const k of primaryKeywords) {
        if (!k) continue;
        if (lower.includes(k.toLowerCase())) return true;
      }
      return false;
    };

    // Filter titles that already match
    let good = titles.filter(t => typeof t === 'string' && containsKeywordOrBrand(t));

    // If none match, attempt to patch titles by prepending brand or first keyword
    if (good.length === 0) {
      const token = brandHint || primaryKeywords[0] || '';
      if (token) {
        good = titles.map(t => {
          if (typeof t !== 'string') return t;
          // If token already present, keep; else prepend
          if (t.toLowerCase().includes(token.toLowerCase())) return t;
          return `${token} - ${t}`.slice(0, 60);
        });
      }
    }

    // Ensure we return exactly 'count' items; pad or trim as needed
    const unique = Array.from(new Set(good)).slice(0, count);
    while (unique.length < count && titles.length > 0) {
      const candidate = titles.shift();
      if (!unique.includes(candidate)) unique.push(candidate);
    }

    return unique;
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
