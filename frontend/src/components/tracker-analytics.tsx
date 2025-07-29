"use client";

import { useAuth } from "@clerk/nextjs";
import {
  BarChart3,
  Clock,
  Eye,
  Globe,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Activity,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import Toast from "./Toast";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { StatCard } from './ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

interface TrackerAnalyticsProps {
  siteId: string;
  siteName: string;
  className?: string;
}

interface AnalyticsData {
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
}

interface DemographicsData {
  trafficSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Record<string, number>;
  geographicData: Array<{
    ip: string;
    count: number;
  }>;
  timeRange: string;
  totalSessions: number;
}

interface PagePerformanceData {
  pagePerformance: Array<{
    url: string;
    views: number;
    uniqueVisitors: number;
    avgLoadTime: number;
    bounceRate: number;
    avgSessionDuration: number;
    hasOptimizedContent: boolean;
    performanceScore: number;
    loadTimeScore: number;
    bounceRateScore: number;
    engagementScore: number;
  }>;
  contentOptimizations: Array<{
    url: string;
    contentType: string;
    deployedAt?: string;
    metadata?: Record<string, unknown>;
  }>;
  summary: {
    totalPages: number;
    avgPerformanceScore: number;
    optimizedPages: number;
    highPerformingPages: number;
  };
  timeRange: string;
}

export default function TrackerAnalytics({ 
  siteId, 
  siteName, 
  className = "" 
}: TrackerAnalyticsProps) {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [pagePerformance, setPagePerformance] = useState<PagePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [siteId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      // Load all analytics data in parallel
      const [analyticsRes, demographicsRes, performanceRes] = await Promise.all([
        fetch(`${API_BASE}/sites/${siteId}/analytics?timeRange=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE}/sites/${siteId}/analytics/demographics?timeRange=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE}/sites/${siteId}/analytics/page-performance?timeRange=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!analyticsRes.ok || !demographicsRes.ok || !performanceRes.ok) {
        throw new Error('Failed to load analytics');
      }

      const [analyticsData, demographicsData, performanceData] = await Promise.all([
        analyticsRes.json(),
        demographicsRes.json(),
        performanceRes.json()
      ]);

      setAnalytics(analyticsData);
      setDemographics(demographicsData);
      setPagePerformance(performanceData);
      } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics';
    setToast({ 
      message: errorMessage, 
      type: 'error' 
    });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };



  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No analytics data available</p>
        <Button onClick={loadAnalytics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics - {siteName}</h2>
          <p className="text-muted-foreground">Comprehensive tracking and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 border rounded-lg p-1">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Traffic Sources</TabsTrigger>
          <TabsTrigger value="performance">Page Performance</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Eye}
              title="Total Views"
              value={formatNumber(analytics.overview.totalViews)}
              badge={analytics.overview.trendsPercentage.views > 0 ? `+${analytics.overview.trendsPercentage.views.toFixed(1)}%` : `${analytics.overview.trendsPercentage.views.toFixed(1)}%`}
              trend={analytics.overview.trendsPercentage.views > 0 ? 'Trending up' : analytics.overview.trendsPercentage.views < 0 ? 'Trending down' : 'No change'}
              trendIcon={analytics.overview.trendsPercentage.views > 0 ? TrendingUp : analytics.overview.trendsPercentage.views < 0 ? TrendingDown : undefined}
              trendColor={analytics.overview.trendsPercentage.views > 0 ? 'text-green-600 dark:text-green-400' : analytics.overview.trendsPercentage.views < 0 ? 'text-destructive' : 'text-muted-foreground'}
              description="Total page views for the selected period"
            />
            <StatCard
              icon={Users}
              title="Unique Visitors"
              value={formatNumber(analytics.overview.uniqueVisitors)}
              badge={analytics.overview.trendsPercentage.visitors > 0 ? `+${analytics.overview.trendsPercentage.visitors.toFixed(1)}%` : `${analytics.overview.trendsPercentage.visitors.toFixed(1)}%`}
              trend={analytics.overview.trendsPercentage.visitors > 0 ? 'Trending up' : analytics.overview.trendsPercentage.visitors < 0 ? 'Trending down' : 'No change'}
              trendIcon={analytics.overview.trendsPercentage.visitors > 0 ? TrendingUp : analytics.overview.trendsPercentage.visitors < 0 ? TrendingDown : undefined}
              trendColor={analytics.overview.trendsPercentage.visitors > 0 ? 'text-green-600 dark:text-green-400' : analytics.overview.trendsPercentage.visitors < 0 ? 'text-destructive' : 'text-muted-foreground'}
              description="Unique visitors for the selected period"
            />
            <StatCard
              icon={Clock}
              title="Avg Load Time"
              value={`${analytics.overview.avgLoadTime}ms`}
              badge={analytics.overview.trendsPercentage.loadTime < 0 ? `${analytics.overview.trendsPercentage.loadTime.toFixed(1)}% faster` : `${analytics.overview.trendsPercentage.loadTime.toFixed(1)}% slower`}
              trend={analytics.overview.trendsPercentage.loadTime < 0 ? 'Improved' : analytics.overview.trendsPercentage.loadTime > 0 ? 'Slower' : 'No change'}
              trendIcon={analytics.overview.trendsPercentage.loadTime < 0 ? TrendingUp : analytics.overview.trendsPercentage.loadTime > 0 ? TrendingDown : undefined}
              trendColor={analytics.overview.trendsPercentage.loadTime < 0 ? 'text-green-600 dark:text-green-400' : analytics.overview.trendsPercentage.loadTime > 0 ? 'text-destructive' : 'text-muted-foreground'}
              description="Average page load time (lower is better)"
            />
            <StatCard
              icon={Target}
              title="Deployments"
              value={analytics.overview.contentDeployments}
              badge={analytics.overview.trendsPercentage.deployments > 0 ? `+${analytics.overview.trendsPercentage.deployments.toFixed(1)}%` : `${analytics.overview.trendsPercentage.deployments.toFixed(1)}%`}
              trend={analytics.overview.trendsPercentage.deployments > 0 ? 'More deployments' : analytics.overview.trendsPercentage.deployments < 0 ? 'Fewer deployments' : 'No change'}
              trendIcon={analytics.overview.trendsPercentage.deployments > 0 ? TrendingUp : analytics.overview.trendsPercentage.deployments < 0 ? TrendingDown : undefined}
              trendColor={analytics.overview.trendsPercentage.deployments > 0 ? 'text-green-600 dark:text-green-400' : analytics.overview.trendsPercentage.deployments < 0 ? 'text-destructive' : 'text-muted-foreground'}
              description="Content deployments for the selected period"
            />
          </div>

          {/* Top Pages and Content Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Top Performing Pages</span>
                </CardTitle>
                <CardDescription>Pages with highest view counts and best performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.url}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">{formatNumber(page.views)} views</span>
                          <span className="text-xs text-muted-foreground">{page.avgLoadTime}ms load</span>
                          <span className="text-xs text-muted-foreground">{page.bounceRate}% bounce</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {page.hasDeployedContent && (
                          <Badge variant="default" className="text-xs">
                            Optimized
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Content Performance</span>
                </CardTitle>
                <CardDescription>Impact of deployed content optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.contentPerformance.map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium capitalize">{content.contentType}</p>
                          <Badge variant="outline" className="text-xs">
                            {content.deployedCount} deployed
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(content.views)} views
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Top: {content.topPerformingUrl}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{content.avgImprovementPercent}%
                        </p>
                        <p className="text-xs text-muted-foreground">improvement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          {demographics && (
            <>
              {/* Traffic Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5" />
                    <span>Traffic Sources</span>
                  </CardTitle>
                  <CardDescription>Where your visitors are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demographics.trafficSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{source.source}</p>
                            <p className="text-xs text-muted-foreground">{formatNumber(source.count)} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{source.percentage}%</p>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${source.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <span>Device Breakdown</span>
                  </CardTitle>
                  <CardDescription>How visitors access your site</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(demographics.deviceBreakdown).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getDeviceIcon(device)}
                          <div>
                            <p className="text-sm font-medium capitalize">{device}</p>
                            <p className="text-xs text-muted-foreground">{formatNumber(count)} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {Math.round((count / demographics.totalSessions) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {pagePerformance && (
            <>
              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{pagePerformance.summary.totalPages}</p>
                        <p className="text-sm text-muted-foreground">Total Pages</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold">{pagePerformance.summary.avgPerformanceScore}</p>
                        <p className="text-sm text-muted-foreground">Avg Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold">{pagePerformance.summary.optimizedPages}</p>
                        <p className="text-sm text-muted-foreground">Optimized</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold">{pagePerformance.summary.highPerformingPages}</p>
                        <p className="text-sm text-muted-foreground">High Performing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Page Performance List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Page Performance</span>
                  </CardTitle>
                  <CardDescription>Detailed performance metrics for each page</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pagePerformance.pagePerformance.map((page, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{page.url}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-muted-foreground">{formatNumber(page.views)} views</span>
                              <span className="text-xs text-muted-foreground">{page.avgLoadTime}ms load</span>
                              <span className="text-xs text-muted-foreground">{page.bounceRate}% bounce</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={page.performanceScore >= 80 ? "default" : page.performanceScore >= 60 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {page.performanceScore}/100
                            </Badge>
                            {page.hasOptimizedContent && (
                              <Badge variant="outline" className="text-xs">
                                Optimized
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Performance Scores */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Load Time</p>
                            <div className="flex items-center space-x-2">
                              <Progress value={page.loadTimeScore} className="flex-1" />
                              <span className="text-xs font-medium">{page.loadTimeScore}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Bounce Rate</p>
                            <div className="flex items-center space-x-2">
                              <Progress value={page.bounceRateScore} className="flex-1" />
                              <span className="text-xs font-medium">{page.bounceRateScore}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                            <div className="flex items-center space-x-2">
                              <Progress value={page.engagementScore} className="flex-1" />
                              <span className="text-xs font-medium">{page.engagementScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Latest tracker events and content deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.type === 'page_view' && <Eye className="h-4 w-4 text-primary" />}
                      {activity.type === 'content_injection' && <Target className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {activity.type === 'deployment' && <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {activity.type === 'page_view' && 'Page viewed'}
                        {activity.type === 'content_injection' && 'Content injected'}
                        {activity.type === 'deployment' && 'Content deployed'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{activity.url}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 