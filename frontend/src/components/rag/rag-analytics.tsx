'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Clock, Target, Brain, FileText, Zap } from 'lucide-react';
import { getSites, getPageDetails } from '@/lib/api';

interface RAGAnalyticsProps {
  siteId: string;
  pageId?: string;
}

interface AnalyticsData {
  totalGenerations: number;
  ragEnhancedCount: number;
  averageRagScore: number;
  contentTypes: Record<string, number>;
  performanceMetrics: {
    averageResponseTime: number;
    averageContextRetrievalTime: number;
    averageGenerationTime: number;
  };
}

interface RAGQuery {
  id: string;
  queryText: string;
  responseText: string;
  responseTimeMs: number;
  similarityScores: number[];
  feedbackScore?: number;
  createdAt: string;
}

export function RAGAnalytics({ siteId, pageId }: RAGAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentQueries, setRecentQueries] = useState<RAGQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
    loadRecentQueries();
  }, [siteId, pageId]);

  const loadAnalytics = async () => {
    try {
      // For now, we'll simulate analytics since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      const mockAnalytics = {
        totalGenerations: 15,
        ragEnhancedCount: 12,
        averageRagScore: 0.82,
        contentTypes: {
          title: 5,
          description: 4,
          faq: 3,
          paragraph: 2,
          keywords: 1,
        },
        performanceMetrics: {
          averageResponseTime: 1800,
          averageContextRetrievalTime: 900,
          averageGenerationTime: 900,
        },
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading RAG analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentQueries = async () => {
    try {
      // For now, we'll simulate recent queries since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      const mockQueries = [
        {
          id: '1',
          queryText: 'What are the best practices for AI SEO?',
          responseText: 'AI SEO best practices include optimizing for featured snippets, using structured data, and creating content that answers user queries directly.',
          responseTimeMs: 1200,
          similarityScores: [0.85, 0.78, 0.92],
          feedbackScore: 4,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          queryText: 'How to improve page load speed?',
          responseText: 'Page load speed can be improved by optimizing images, minifying CSS/JS, using CDN, and implementing lazy loading.',
          responseTimeMs: 950,
          similarityScores: [0.79, 0.88, 0.81],
          feedbackScore: 5,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      
      setRecentQueries(mockQueries);
    } catch (error) {
      console.error('Error loading recent queries:', error);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RAG Analytics</h2>
          <p className="text-muted-foreground">
            Performance metrics and insights for AI content generation
          </p>
        </div>
        
        <Badge variant="outline" className="flex items-center space-x-1">
          <Brain className="h-3 w-3" />
          <span>RAG System</span>
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Generations</p>
                <p className="text-2xl font-bold">{analytics.totalGenerations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">RAG Enhanced</p>
                <p className="text-2xl font-bold">{analytics.ragEnhancedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Avg RAG Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.averageRagScore)}`}>
                  {(analytics.averageRagScore * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Avg Response</p>
                <p className="text-2xl font-bold">
                  {formatTime(analytics.performanceMetrics.averageResponseTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="queries">Recent Queries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Content Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Content Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of generated content by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.contentTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type}</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(count / analytics.totalGenerations) * 100} 
                          className="w-20" 
                        />
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* RAG Performance */}
            <Card>
              <CardHeader>
                <CardTitle>RAG Performance</CardTitle>
                <CardDescription>
                  Quality metrics for RAG-enhanced content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Average RAG Score</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(analytics.averageRagScore)}`}>
                        {getPerformanceLabel(analytics.averageRagScore)}
                      </span>
                    </div>
                    <Progress value={analytics.averageRagScore * 100} />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">RAG Enhancement Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {analytics.totalGenerations > 0 
                          ? ((analytics.ragEnhancedCount / analytics.totalGenerations) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={analytics.totalGenerations > 0 
                        ? (analytics.ragEnhancedCount / analytics.totalGenerations) * 100 
                        : 0} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed timing and efficiency metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">Response Time</h4>
                  <p className="text-2xl font-bold">
                    {formatTime(analytics.performanceMetrics.averageResponseTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">Average</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">Context Retrieval</h4>
                  <p className="text-2xl font-bold">
                    {formatTime(analytics.performanceMetrics.averageContextRetrievalTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">Average</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">Generation Time</h4>
                  <p className="text-2xl font-bold">
                    {formatTime(analytics.performanceMetrics.averageGenerationTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">Average</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent RAG Queries</CardTitle>
              <CardDescription>
                Latest queries and their performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentQueries.length > 0 ? (
                <div className="space-y-4">
                  {recentQueries.slice(0, 10).map((query) => (
                    <div key={query.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {query.queryText.substring(0, 50)}...
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {formatTime(query.responseTimeMs)}
                          </Badge>
                          {query.feedbackScore && (
                            <Badge variant="secondary" className="text-xs">
                              {query.feedbackScore}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {query.responseText.substring(0, 100)}...
                      </p>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(query.createdAt).toLocaleDateString()}
                        </span>
                        {query.similarityScores.length > 0 && (
                          <span>
                            Avg Similarity: {(query.similarityScores.reduce((a, b) => a + b, 0) / query.similarityScores.length * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent queries found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 