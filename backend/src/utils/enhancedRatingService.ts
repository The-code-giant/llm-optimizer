import { db } from '../db/client';
import { 
  contentRatings, 
  contentRecommendations, 
  contentDeployments,
  contentAnalysis 
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface SectionRating {
  title: number;        // 0-10 score
  description: number;  // 0-10 score
  headings: number;     // 0-10 score
  content: number;      // 0-10 score
  schema: number;       // 0-10 score
  images: number;       // 0-10 score
  links: number;        // 0-10 score
}

export interface SectionRecommendations {
  title: string[];
  description: string[];
  headings: string[];
  content: string[];
  schema: string[];
  images: string[];
  links: string[];
}

export class EnhancedRatingService {
  /**
   * Calculate total score from section ratings
   */
  static calculateTotalScore(sectionRatings: SectionRating): number {
    const scores = Object.values(sectionRatings);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const maxPossible = scores.length * 10; // 7 sections * 10 = 70
    return Math.round((total / maxPossible) * 100); // Convert to percentage
  }

  /**
   * Save section ratings to database
   */
  static async saveSectionRatings(
    pageId: string, 
    analysisResultId: string, 
    sectionRatings: SectionRating
  ): Promise<void> {
    // Delete existing ratings for this analysis
    await db.delete(contentRatings)
      .where(eq(contentRatings.analysisResultId, analysisResultId));

    // Insert new content ratings
    for (const [sectionType, score] of Object.entries(sectionRatings)) {
      await db.insert(contentRatings).values({
        pageId,
        analysisResultId,
        sectionType,
        currentScore: score,
        maxScore: 10,
        improvementCount: 0,
      });
    }
  }

  /**
   * Save section-specific recommendations to database
   */
  static async saveSectionRecommendations(
    pageId: string,
    analysisResultId: string,
    contentRecommendationsData: SectionRecommendations
  ): Promise<void> {
    // Delete existing recommendations for this analysis
    await db.delete(contentRecommendations)
      .where(eq(contentRecommendations.analysisResultId, analysisResultId));

    // Insert new content recommendations
    for (const [sectionType, recommendations] of Object.entries(contentRecommendationsData)) {
      if (recommendations.length > 0) {
        await db.insert(contentRecommendations).values({
          pageId,
          analysisResultId,
          sectionType,
          recommendations,
          priority: this.calculatePriority(recommendations),
          estimatedImpact: this.estimateImpact(recommendations),
        });
      }
    }
  }

  /**
   * Get section recommendations for a specific section type
   */
  static async getSectionRecommendations(
    pageId: string, 
    sectionType: string
  ): Promise<Array<{
    title: string;
    priority: string;
    description: string;
    expectedImpact: number;
    implementation: string;
  }>> {
    
    const result = await db.select()
      .from(contentRecommendations)
      .where(and(
        eq(contentRecommendations.pageId, pageId),
        eq(contentRecommendations.sectionType, sectionType)
      ))
      .orderBy(desc(contentRecommendations.createdAt));


    if (result.length === 0) return [];
    
    // Aggregate all recommendations from all records
    const allRecommendations: Array<{
      title: string;
      priority: string;
      description: string;
      expectedImpact: number;
      implementation: string;
    }> = [];
    
    for (const record of result) {
      try {
        const recommendations = record.recommendations as any;
        
        if (Array.isArray(recommendations)) {
          for (const rec of recommendations) {
            if (typeof rec === 'string') {
              // Convert string to object format for backward compatibility
              allRecommendations.push({
                title: rec,
                priority: 'medium',
                description: rec,
                expectedImpact: 1,
                implementation: rec
              });
            } else if (rec && typeof rec === 'object') {
              // Return the full recommendation object
              allRecommendations.push({
                title: rec.title || 'Untitled Recommendation',
                priority: rec.priority || 'medium',
                description: rec.description || rec.title || 'No description available',
                expectedImpact: rec.expectedImpact || 1,
                implementation: rec.implementation || rec.description || rec.title || 'No implementation details'
              });
            }
          }
        } else if (typeof recommendations === 'string') {
          // Single string recommendation - convert to object format
          allRecommendations.push({
            title: recommendations,
            priority: 'medium',
            description: recommendations,
            expectedImpact: 1,
            implementation: recommendations
          });
        }
      } catch (error) {
        console.error('Error parsing recommendations:', error);
      }
    }
    
    // Remove duplicates based on title
    const uniqueRecommendations = allRecommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.title === rec.title)
    );
    
    return uniqueRecommendations;
  }

  /**
   * Get current section ratings for a page
   */
  static async getCurrentSectionRatings(pageId: string): Promise<SectionRating | null> {
    const result = await db.select()
      .from(contentRatings)
      .where(eq(contentRatings.pageId, pageId))
      .orderBy(contentRatings.updatedAt);

    if (result.length === 0) return null;

    const ratings: SectionRating = {
      title: 0,
      description: 0,
      headings: 0,
      content: 0,
      schema: 0,
      images: 0,
      links: 0,
    };

    for (const row of result) {
      if (row.sectionType in ratings) {
        ratings[row.sectionType as keyof SectionRating] = row.currentScore;
      }
    }

    return ratings;
  }

  /**
   * Record content deployment and update section score
   */
  static async recordContentDeployment(
    pageId: string,
    sectionType: string,
    previousScore: number,
    newScore: number,
    deployedContent: string,
    aiModel: string,
    deployedBy: string
  ): Promise<void> {
    const scoreImprovement = newScore - previousScore;

    // First, deactivate all existing deployments for this page and section type
    await db.update(contentDeployments)
      .set({ isActive: 0 })
      .where(and(
        eq(contentDeployments.pageId, pageId),
        eq(contentDeployments.sectionType, sectionType),
        eq(contentDeployments.isActive, 1)
      ));

    // Record the new active deployment
    await db.insert(contentDeployments).values({
      pageId,
      sectionType,
      previousScore,
      newScore,
      scoreImprovement,
      deployedContent,
      aiModel,
      deployedBy,
      status: 'deployed',
      isActive: 1
    });

    // Update the content rating
    await db.update(contentRatings)
      .set({
        previousScore,
        currentScore: newScore,
        lastImprovedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(contentRatings.pageId, pageId),
        eq(contentRatings.sectionType, sectionType)
      ));

    // Increment improvement count separately
    const currentRating = await db.select()
      .from(contentRatings)
      .where(and(
        eq(contentRatings.pageId, pageId),
        eq(contentRatings.sectionType, sectionType)
      ))
      .limit(1);

    if (currentRating.length > 0) {
      const currentCount = currentRating[0].improvementCount || 0;
      await db.update(contentRatings)
        .set({
          improvementCount: currentCount + 1
        })
        .where(and(
          eq(contentRatings.pageId, pageId),
          eq(contentRatings.sectionType, sectionType)
        ));
    }
  }

  /**
   * Get improvement history for a section
   */
  static async getSectionImprovementHistory(
    pageId: string, 
    sectionType: string
  ): Promise<any[]> {
    return await db.select()
      .from(contentDeployments)
      .where(and(
        eq(contentDeployments.pageId, pageId),
        eq(contentDeployments.sectionType, sectionType)
      ))
      .orderBy(contentDeployments.deployedAt);
  }

  /**
   * Calculate priority based on recommendations
   */
  private static calculatePriority(recommendations: string[]): string {
    if (recommendations.some(rec => 
      rec.toLowerCase().includes('critical') || 
      rec.toLowerCase().includes('urgent') ||
      rec.toLowerCase().includes('immediate')
    )) {
      return 'critical';
    }
    
    if (recommendations.some(rec => 
      rec.toLowerCase().includes('important') || 
      rec.toLowerCase().includes('significant')
    )) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Estimate impact score (0-10) based on recommendations
   */
  private static estimateImpact(recommendations: string[]): number {
    let impact = 0;
    
    for (const rec of recommendations) {
      const lower = rec.toLowerCase();
      
      if (lower.includes('title') || lower.includes('meta description')) {
        impact += 2; // High impact for core SEO elements
      } else if (lower.includes('schema') || lower.includes('structured data')) {
        impact += 1.5; // Medium-high impact
      } else if (lower.includes('headings') || lower.includes('content')) {
        impact += 1; // Medium impact
      } else if (lower.includes('images') || lower.includes('links')) {
        impact += 0.5; // Lower impact
      }
    }
    
    return Math.min(10, Math.round(impact * 10) / 10);
  }
}

