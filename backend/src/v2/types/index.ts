export interface ApiResponseV2<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  version: '2.0';
  timestamp: string;
}

export interface PaginationV2 {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EnhancedPageV2 {
  id: string;
  url: string;
  title?: string;
  contentSnapshot?: string;
  lastScannedAt?: Date;
  lastAnalysisAt?: Date;
  pageScore?: number;
  analysisCount: number;
  latestAnalysis?: {
    id: string;
    overallScore: number;
    analyzedAt: Date;
    llmModelUsed: string;
    analysisVersion: string;
  };
  enhancementLevel: 'basic' | 'firecrawl';
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedSiteV2 {
  id: string;
  name: string;
  url: string;
  trackerId: string;
  status: string;
  settings: Record<string, any>;
  averageLLMScore?: number;
  totalPages: number;
  pagesWithScores: number;
  lastMetricsUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirecrawlConfig {
  apiKey?: string;
  maxConcurrency: number;
  rateLimitDelay: number;
  retryAttempts: number;
}

export interface CompetitiveAnalysisConfig {
  maxCompetitors: number;
  analysisDepth: 'basic' | 'enhanced';
  includeContentGaps: boolean;
  trackKeywords: boolean;
}

export interface AnalyticsTimeframe {
  period: '7d' | '30d' | '90d' | '1y';
  startDate?: Date;
  endDate?: Date;
}

export interface BulkOperationResultV2<T = any> {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: Array<{
    id?: string;
    status: 'success' | 'error';
    data?: T;
    error?: string;
  }>;
}