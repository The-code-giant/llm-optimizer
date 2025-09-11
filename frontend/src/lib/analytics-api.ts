const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

export interface AnalyticsOverview {
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    avgLoadTime: number;
    contentDeployments: number;
    trendsPercentage: {
      views: number;
      visitors: number;
      loadTime: number;
      deployments: number;
    };
  };
  topPages: Array<{
    url: string;
    views: number;
    avgLoadTime: number;
    bounceRate: number;
    hasDeployedContent: boolean;
    lastOptimized?: string;
  }>;
  contentPerformance: Array<{
    contentType: string;
    deployedCount: number;
    avgImprovementPercent: number;
    topPerformingUrl: string;
    views: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    type: 'page_view' | 'content_injection' | 'deployment';
    url: string;
    metadata?: Record<string, unknown>;
  }>;
  timeSeriesData: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
    avgLoadTime: number;
  }>;
  timeRange: string;
}

export interface DemographicsData {
  trafficSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  geographicData: Array<{
    ip: string;
    count: number;
  }>;
  timeRange: string;
  totalSessions: number;
}

export interface PagePerformanceData {
  pagePerformance: Array<{
    url: string;
    views: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    loadTimeMs: number;
    hasOptimizedContent: boolean;
    performanceScore: number;
    loadTimeScore: number;
    bounceRateScore: number;
    engagementScore: number;
  }>;
  summary: {
    totalPages: number;
    totalViews: number;
    totalUniqueVisitors: number;
    avgBounceRate: number;
    avgSessionDuration: number;
    avgLoadTime: number;
    avgPerformanceScore: number;
    optimizedPages: number;
  };
  contentOptimizations: Array<{
    url: string;
    contentType: string;
    deployedAt?: string;
    metadata?: Record<string, unknown>;
  }>;
  performanceMetrics: {
    totalViews: number;
    totalUniqueVisitors: number;
    avgBounceRate: number;
    avgSessionDuration: number;
    avgLoadTime: number;
  };
  timeRange: string;
}

export class AnalyticsAPI {
  private async makeRequest<T>(endpoint: string, token: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : result;
  }

  async getOverview(token: string, siteId: string, timeRange: string = '7d'): Promise<AnalyticsOverview> {
    return this.makeRequest<AnalyticsOverview>(
      `/analytics/${siteId}/overview?timeRange=${timeRange}`,
      token
    );
  }

  async getDemographics(token: string, siteId: string, timeRange: string = '7d'): Promise<DemographicsData> {
    return this.makeRequest<DemographicsData>(
      `/analytics/${siteId}/demographics?timeRange=${timeRange}`,
      token
    );
  }

  async getPagePerformance(token: string, siteId: string, timeRange: string = '7d'): Promise<PagePerformanceData> {
    return this.makeRequest<PagePerformanceData>(
      `/analytics/${siteId}/page-performance?timeRange=${timeRange}`,
      token
    );
  }
}

export const analyticsAPI = new AnalyticsAPI();
