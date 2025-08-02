'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, FileText, BarChart3, Settings, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  getRAGStatus, 
  initializeRAGKnowledgeBase, 
  refreshRAGKnowledgeBase, 
  getRAGAnalytics 
} from '@/lib/api';

interface RAGStatus {
  status: 'initializing' | 'ready' | 'error' | 'not_found';
  totalDocuments: number;
  lastRefresh: string | null;
  errorMessage?: string;
}

interface RAGAnalytics {
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

interface RAGDashboardProps {
  siteId: string;
  pageId?: string;
}

export function RAGDashboard({ siteId, pageId }: RAGDashboardProps) {
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null);
  const [analytics, setAnalytics] = useState<RAGAnalytics | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, we'll use mock data since we need to integrate with auth
    // In a real implementation, you would get the auth token from Clerk or your auth system
    loadRAGStatus();
    if (pageId) {
      loadAnalytics();
    }
    setIsLoading(false);
  }, [siteId, pageId]);

  const loadRAGStatus = async () => {
    try {
      // For now, we'll simulate RAG status since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      setRagStatus({ status: 'not_found', totalDocuments: 0, lastRefresh: null });
    } catch (error) {
      console.error('Error loading RAG status:', error);
      setRagStatus({ status: 'not_found', totalDocuments: 0, lastRefresh: null });
    }
  };

  const loadAnalytics = async () => {
    if (!pageId) return;
    
    try {
      // For now, we'll simulate analytics since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      setAnalytics({
        totalGenerations: 0,
        ragEnhancedCount: 0,
        averageRagScore: 0,
        contentTypes: {},
        performanceMetrics: {
          averageResponseTime: 0,
          averageContextRetrievalTime: 0,
          averageGenerationTime: 0,
        },
      });
    } catch (error) {
      console.error('Error loading RAG analytics:', error);
    }
  };

  const initializeKnowledgeBase = async () => {
    setIsInitializing(true);
    try {
      // For now, we'll simulate initialization since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      setRagStatus({ status: 'ready', totalDocuments: 25, lastRefresh: new Date().toISOString() });
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const refreshKnowledgeBase = async () => {
    setIsRefreshing(true);
    try {
      // For now, we'll simulate refresh since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      setRagStatus({ status: 'ready', totalDocuments: 30, lastRefresh: new Date().toISOString() });
    } catch (error) {
      console.error('Error refreshing knowledge base:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'initializing': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'initializing': return 'Initializing';
      case 'error': return 'Error';
      default: return 'Not Found';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2 text-muted-foreground">Loading RAG system...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">RAG Knowledge Base</h2>
            <p className="text-muted-foreground">
              AI-powered content generation using your site's data
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {ragStatus?.status === 'ready' && (
            <Button
              variant="outline"
              onClick={refreshKnowledgeBase}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          )}
          
          {ragStatus?.status !== 'ready' && (
            <Button
              onClick={initializeKnowledgeBase}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Initialize
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(ragStatus?.status || 'not_found')}`} />
            <span>Knowledge Base Status</span>
          </CardTitle>
          <CardDescription>
            Current status of your site's AI knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ragStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                <Badge variant={ragStatus.status === 'ready' ? 'default' : 'secondary'}>
                  {getStatusText(ragStatus.status)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Documents</span>
                <span className="text-muted-foreground">{ragStatus.totalDocuments}</span>
              </div>
              
              {ragStatus.lastRefresh && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Last Updated</span>
                  <span className="text-muted-foreground">
                    {new Date(ragStatus.lastRefresh).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {ragStatus.errorMessage && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{ragStatus.errorMessage}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>RAG Analytics</span>
            </CardTitle>
            <CardDescription>
              Performance metrics for RAG-enhanced content generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.totalGenerations}</div>
                <div className="text-sm text-muted-foreground">Total Generations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.ragEnhancedCount}</div>
                <div className="text-sm text-muted-foreground">RAG Enhanced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(analytics.averageRagScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg RAG Score</div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Content Type Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analytics.contentTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize">{type}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different features */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How RAG Works</CardTitle>
              <CardDescription>
                Understanding your AI-powered content generation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">1. Content Crawling</h4>
                  <p className="text-sm text-muted-foreground">
                    Your site's content is automatically crawled and analyzed
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">2. AI Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Content is processed and stored in our AI knowledge base
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">3. Smart Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate contextually relevant content using your site's data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generate">
          <RAGContentGenerator siteId={siteId} pageId={pageId} />
        </TabsContent>
        
        <TabsContent value="settings">
          <RAGSettings siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// RAG Content Generator Component
function RAGContentGenerator({ siteId, pageId }: { siteId: string; pageId?: string }) {
  const [contentType, setContentType] = useState('title');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const generateContent = async () => {
    if (!pageId || !topic) return;
    
    setIsGenerating(true);
    try {
      const response = await api.post(`/pages/${pageId}/rag-generate`, {
        contentType,
        topic,
        additionalContext,
        useRAG: true,
      });
      setGeneratedContent(response.data);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate RAG-Enhanced Content</CardTitle>
        <CardDescription>
          Create contextually relevant content using your site's knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="title">Title</option>
              <option value="description">Description</option>
              <option value="faq">FAQ</option>
              <option value="paragraph">Paragraph</option>
              <option value="keywords">Keywords</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AI SEO optimization"
              className="w-full mt-1 p-2 border rounded-md"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Additional Context</label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Additional context or requirements..."
            className="w-full mt-1 p-2 border rounded-md h-20"
          />
        </div>
        
        <Button
          onClick={generateContent}
          disabled={isGenerating || !pageId || !topic}
          className="w-full"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          Generate Content
        </Button>
        
        {generatedContent && (
          <div className="mt-6 p-4 border rounded-lg bg-muted">
            <h4 className="font-medium mb-2">Generated Content</h4>
            <p className="text-sm mb-2">{generatedContent.content}</p>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>RAG Score: {(generatedContent.ragScore * 100).toFixed(1)}%</span>
              <span>Enhanced: {generatedContent.ragEnhanced ? 'Yes' : 'No'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// RAG Settings Component
function RAGSettings({ siteId }: { siteId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>RAG Settings</CardTitle>
        <CardDescription>
          Configure your RAG knowledge base settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Settings configuration coming soon...
        </p>
      </CardContent>
    </Card>
  );
} 