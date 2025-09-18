import { Request, Response } from 'express';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { FirecrawlService } from '../services/FirecrawlService';
import { AnalysisServiceV2 } from '../services/AnalysisServiceV2';
import { db } from '../../db/client';
import { sites, pages, contentAnalysis } from '../../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

export class AnalysisControllerV2 extends BaseController {
  private firecrawlService: FirecrawlService;
  private analysisService: AnalysisServiceV2;

  constructor() {
    super();
    this.firecrawlService = FirecrawlService.getInstance();
    this.analysisService = new AnalysisServiceV2(this.firecrawlService);
  }

  /**
   * Enhanced page analysis using Firecrawl
   */
  analyzePageEnhanced = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pageId } = req.params;
      const authenticatedReq = req as AuthenticatedRequest;

      // Get page details
      const pageResult = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(
          and(
            eq(pages.id, pageId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (pageResult.length === 0) {
        return this.error(res, 'Page not found or not authorized', 404);
      }

      const page = pageResult[0].pages;
      
      // Enhanced analysis using Firecrawl
      const analysisResult = await this.analysisService.analyzePageEnhanced(page.url);
      
      // Save analysis to database
      const analysisId = await this.analysisService.saveEnhancedAnalysis(page.id, analysisResult);
      
      this.success(res, {
        pageId: page.id,
        url: page.url,
        analysis: analysisResult,
        analysisId,
        enhancementLevel: 'firecrawl'
      }, 'Enhanced analysis completed successfully');

    } catch (error) {
      this.handleError(res, error, 'Enhanced Page Analysis');
    }
  };

  /**
   * Bulk enhanced analysis for multiple pages
   */
  bulkAnalyzeEnhanced = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pageIds, siteId } = req.body;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify site ownership
      const site = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (site.length === 0) {
        return this.error(res, 'Site not found or not authorized', 404);
      }

      // Get pages to analyze
      let whereConditions = [eq(pages.siteId, siteId)];
      if (pageIds && pageIds.length > 0) {
        whereConditions.push(inArray(pages.id, pageIds));
      }

      const pagesToAnalyze = await db
        .select()
        .from(pages)
        .where(and(...whereConditions))
        .limit(50); // Safety limit

      // Process pages in batches
      const results = [];
      for (const page of pagesToAnalyze) {
        try {
          const analysis = await this.analysisService.analyzePageEnhanced(page.url);
          const analysisId = await this.analysisService.saveEnhancedAnalysis(page.id, analysis);
          results.push({
            pageId: page.id,
            url: page.url,
            status: 'success',
            analysis,
            analysisId
          });
        } catch (error: any) {
          results.push({
            pageId: page.id,
            url: page.url,
            status: 'error',
            error: error.message
          });
        }
      }

      this.success(res, {
        totalProcessed: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      }, 'Bulk enhanced analysis completed');

    } catch (error) {
      this.handleError(res, error, 'Bulk Enhanced Analysis');
    }
  };

  /**
   * Get enhanced analysis history
   */
  getEnhancedAnalysisHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pageId } = req.params;
      const authenticatedReq = req as AuthenticatedRequest;

      // Verify page ownership
      const pageResult = await db
        .select()
        .from(pages)
        .innerJoin(sites, eq(pages.siteId, sites.id))
        .where(
          and(
            eq(pages.id, pageId),
            eq(sites.userId, authenticatedReq.user.id)
          )
        )
        .limit(1);

      if (pageResult.length === 0) {
        return this.error(res, 'Page not found or not authorized', 404);
      }

      // Get enhanced analysis history
      const analysisHistory = await db
        .select()
        .from(contentAnalysis)
        .where(eq(contentAnalysis.pageId, pageId))
        .orderBy(desc(contentAnalysis.analyzedAt))
        .limit(20);

      this.success(res, {
        pageId,
        history: analysisHistory.map(analysis => ({
          id: analysis.id,
          analyzedAt: analysis.analyzedAt,
          overallScore: analysis.overallScore,
          enhancementLevel: analysis.analysisVersion === '2.0' ? 'firecrawl' : 'basic',
          llmModelUsed: analysis.llmModelUsed,
          confidence: analysis.confidence
        }))
      });

    } catch (error) {
      this.handleError(res, error, 'Enhanced Analysis History');
    }
  };
}