"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Clock,
  Target,
  Globe,
  Users,
  MousePointer,
  RefreshCw,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import Toast from "./Toast";

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
    metadata?: any;
  }>;
  timeSeriesData: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
    avgLoadTime: number;
  }>;
}

export default function TrackerAnalytics({ 
  siteId, 
  siteName, 
  className = "" 
}: TrackerAnalyticsProps) {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [siteId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/sites/${siteId}/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to load analytics', 
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

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (percentage < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  const getTrendColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600";
    if (percentage < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
        <p className="text-gray-500">No analytics data available</p>
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
          <p className="text-gray-600">Tracker performance and content optimization metrics</p>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalViews)}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(analytics.overview.trendsPercentage.views)}
              <span className={`text-sm ml-1 ${getTrendColor(analytics.overview.trendsPercentage.views)}`}>
                {Math.abs(analytics.overview.trendsPercentage.views).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.overview.uniqueVisitors)}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(analytics.overview.trendsPercentage.visitors)}
              <span className={`text-sm ml-1 ${getTrendColor(analytics.overview.trendsPercentage.visitors)}`}>
                {Math.abs(analytics.overview.trendsPercentage.visitors).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
                <p className="text-2xl font-bold">{analytics.overview.avgLoadTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(-analytics.overview.trendsPercentage.loadTime)} {/* Negative because lower is better */}
              <span className={`text-sm ml-1 ${getTrendColor(-analytics.overview.trendsPercentage.loadTime)}`}>
                {Math.abs(analytics.overview.trendsPercentage.loadTime).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deployments</p>
                <p className="text-2xl font-bold">{analytics.overview.contentDeployments}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(analytics.overview.trendsPercentage.deployments)}
              <span className={`text-sm ml-1 ${getTrendColor(analytics.overview.trendsPercentage.deployments)}`}>
                {Math.abs(analytics.overview.trendsPercentage.deployments).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
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
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{page.url}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-600">{formatNumber(page.views)} views</span>
                      <span className="text-xs text-gray-600">{page.avgLoadTime}ms load</span>
                      <span className="text-xs text-gray-600">{page.bounceRate}% bounce</span>
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
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium capitalize">{content.contentType}</p>
                      <Badge variant="outline" className="text-xs">
                        {content.deployedCount} deployed
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-600">
                        {formatNumber(content.views)} views
                      </span>
                      <span className="text-xs text-gray-600">
                        Top: {content.topPerformingUrl}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      +{content.avgImprovementPercent}%
                    </p>
                    <p className="text-xs text-gray-500">improvement</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
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
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {activity.type === 'page_view' && <Eye className="h-4 w-4 text-blue-500" />}
                  {activity.type === 'content_injection' && <Target className="h-4 w-4 text-green-500" />}
                  {activity.type === 'deployment' && <Globe className="h-4 w-4 text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {activity.type === 'page_view' && 'Page viewed'}
                    {activity.type === 'content_injection' && 'Content injected'}
                    {activity.type === 'deployment' && 'Content deployed'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{activity.url}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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