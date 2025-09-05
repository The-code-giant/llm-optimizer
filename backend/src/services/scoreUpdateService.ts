import { db } from '../db/client';
import { pages, sites } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { EnhancedRatingService } from '../utils/enhancedRatingService';

/**
 * Service for managing cached page scores and site metrics
 * This service updates page scores and propagates changes to site-level averages
 */
export class ScoreUpdateService {
  
  /**
   * Update a page's cached score from its section ratings
   * @param pageId - The ID of the page to update
   * @returns The updated page score, or null if no section ratings found
   */
  static async updatePageScore(pageId: string): Promise<number | null> {
    try {
      // Get current section ratings
      const sectionRatings = await EnhancedRatingService.getCurrentSectionRatings(pageId);
      
      if (!sectionRatings) {
        console.log(`No section ratings found for page ${pageId}`);
        return null;
      }

      // Calculate overall score from section ratings
      const scores = Object.values(sectionRatings) as number[];
      const total = scores.reduce((sum: number, score: number) => sum + score, 0);
      const maxPossible = scores.length * 10; // 7 sections * 10 = 70
      const pageScore = Math.round((total / maxPossible) * 100); // Convert to percentage

      // Update the page's cached score
      await db.update(pages)
        .set({
          pageScore,
          lastScoreUpdate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(pages.id, pageId));

      console.log(`✅ Updated page ${pageId} score to ${pageScore}%`);

      // Get the page's site ID and update site metrics
      const pageData = await db.select({ siteId: pages.siteId })
        .from(pages)
        .where(eq(pages.id, pageId))
        .limit(1);

      if (pageData.length > 0) {
        await this.updateSiteMetrics(pageData[0].siteId);
      }

      return pageScore;
    } catch (error) {
      console.error(`❌ Failed to update page score for ${pageId}:`, error);
      return null;
    }
  }

  /**
   * Update site-level cached metrics (average score, page counts)
   * @param siteId - The ID of the site to update
   */
  static async updateSiteMetrics(siteId: string): Promise<void> {
    try {
      // Get all pages for this site with their scores
      const sitePages = await db.select({
        id: pages.id,
        pageScore: pages.pageScore,
        llmReadinessScore: pages.llmReadinessScore
      })
      .from(pages)
      .where(eq(pages.siteId, siteId));

      const totalPages = sitePages.length;
      let totalScore = 0;
      let pagesWithScores = 0;

      // Calculate metrics from cached scores
      for (const page of sitePages) {
        // Use pageScore if available, fallback to llmReadinessScore
        const score = page.pageScore ?? page.llmReadinessScore;
        
        if (score != null && score > 0) {
          totalScore += score;
          pagesWithScores++;
        }
      }

      const averageLLMScore = pagesWithScores > 0 
        ? Math.round(totalScore / pagesWithScores)
        : 0;

      // Update site's cached metrics
      await db.update(sites)
        .set({
          averageLLMScore,
          totalPages,
          pagesWithScores,
          lastMetricsUpdate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(sites.id, siteId));

      console.log(`✅ Updated site ${siteId} metrics: ${averageLLMScore}% avg (${pagesWithScores}/${totalPages} pages)`);
    } catch (error) {
      console.error(`❌ Failed to update site metrics for ${siteId}:`, error);
    }
  }

  /**
   * Update scores for all pages in a site
   * Useful for bulk updates or when migrating to the new system
   * @param siteId - The ID of the site to update all pages for
   */
  static async updateAllPagesInSite(siteId: string): Promise<void> {
    try {
      const sitePages = await db.select({ id: pages.id })
        .from(pages)
        .where(eq(pages.siteId, siteId));

      console.log(`🔄 Updating scores for ${sitePages.length} pages in site ${siteId}`);

      for (const page of sitePages) {
        await this.updatePageScore(page.id);
      }

      console.log(`✅ Completed updating all pages in site ${siteId}`);
    } catch (error) {
      console.error(`❌ Failed to update all pages in site ${siteId}:`, error);
    }
  }

  /**
   * Update scores for all pages across all sites
   * Use with caution - this can be a long-running operation
   */
  static async updateAllScores(): Promise<void> {
    try {
      const allSites = await db.select({ id: sites.id, name: sites.name })
        .from(sites)
        .where(sql`${sites.deletedAt} IS NULL`);

      console.log(`🔄 Starting bulk score update for ${allSites.length} sites`);

      for (const site of allSites) {
        console.log(`🔄 Processing site: ${site.name} (${site.id})`);
        await this.updateAllPagesInSite(site.id);
      }

      console.log(`✅ Completed bulk score update for all sites`);
    } catch (error) {
      console.error(`❌ Failed to update all scores:`, error);
    }
  }

  /**
   * Get cached page score, fallback to calculation if not cached
   * @param pageId - The ID of the page
   * @returns The page score (0-100) or 0 if not available
   */
  static async getPageScore(pageId: string): Promise<number> {
    try {
      const pageData = await db.select({
        pageScore: pages.pageScore,
        llmReadinessScore: pages.llmReadinessScore
      })
      .from(pages)
      .where(eq(pages.id, pageId))
      .limit(1);

      if (pageData.length === 0) {
        return 0;
      }

      const page = pageData[0];

      // Return cached score if available
      if (page.pageScore != null) {
        return page.pageScore;
      }

      // Fallback to legacy score
      if (page.llmReadinessScore != null) {
        return page.llmReadinessScore;
      }

      // Last resort: calculate and cache the score
      const calculatedScore = await this.updatePageScore(pageId);
      return calculatedScore ?? 0;
    } catch (error) {
      console.error(`❌ Failed to get page score for ${pageId}:`, error);
      return 0;
    }
  }

  /**
   * Get cached site metrics
   * @param siteId - The ID of the site
   * @returns Site metrics object
   */
  static async getSiteMetrics(siteId: string): Promise<{
    averageLLMScore: number;
    totalPages: number;
    pagesWithScores: number;
  }> {
    try {
      const siteData = await db.select({
        averageLLMScore: sites.averageLLMScore,
        totalPages: sites.totalPages,
        pagesWithScores: sites.pagesWithScores
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);

      if (siteData.length === 0) {
        return { averageLLMScore: 0, totalPages: 0, pagesWithScores: 0 };
      }

      const site = siteData[0];

      // If cached metrics are available, return them
      if (site.averageLLMScore != null) {
        return {
          averageLLMScore: site.averageLLMScore,
          totalPages: site.totalPages ?? 0,
          pagesWithScores: site.pagesWithScores ?? 0
        };
      }

      // If not cached, calculate and cache them
      await this.updateSiteMetrics(siteId);
      
      // Fetch the updated metrics
      const updatedSiteData = await db.select({
        averageLLMScore: sites.averageLLMScore,
        totalPages: sites.totalPages,
        pagesWithScores: sites.pagesWithScores
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);

      if (updatedSiteData.length > 0) {
        const updatedSite = updatedSiteData[0];
        return {
          averageLLMScore: updatedSite.averageLLMScore ?? 0,
          totalPages: updatedSite.totalPages ?? 0,
          pagesWithScores: updatedSite.pagesWithScores ?? 0
        };
      }

      return { averageLLMScore: 0, totalPages: 0, pagesWithScores: 0 };
    } catch (error) {
      console.error(`❌ Failed to get site metrics for ${siteId}:`, error);
      return { averageLLMScore: 0, totalPages: 0, pagesWithScores: 0 };
    }
  }
}
