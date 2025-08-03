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
  refreshRAGKnowledgeBase, 
  getRAGAnalytics,
  generateRAGContent,
  RAGStatus,
  RAGAnalytics,
  RAGGeneratedContent
} from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { BrandContextForm } from './brand-context-form';



interface RAGDashboardProps {
  siteId: string;
  pageId?: string;
}

export function RAGDashboard({ siteId, pageId }: RAGDashboardProps) {
  const { getToken } = useAuth();
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null);
  const [analytics, setAnalytics] = useState<RAGAnalytics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRAGStatus();
    loadAnalytics();
  }, [siteId, pageId]);

  const loadRAGStatus = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      console.log('Loading RAG status for siteId:', siteId);
      const status = await getRAGStatus(token, siteId);
      console.log('RAG status received:', status);
      setRagStatus(status);
    } catch (error) {
      console.error('Error loading RAG status:', error);
      setRagStatus({ status: 'not_found', totalDocuments: 0, lastRefresh: null });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      console.log('Loading RAG analytics for siteId:', siteId, 'pageId:', pageId);
      const analyticsData = await getRAGAnalytics(token, siteId, pageId);
      console.log('RAG analytics received:', analyticsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading RAG analytics:', error);
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
    }
  };



  const refreshKnowledgeBase = async () => {
    setIsRefreshing(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      await refreshRAGKnowledgeBase(token, siteId);
      
      // Reload the status after refresh
      await loadRAGStatus();
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
              <p className="ml-2 text-muted-foreground">Loading Brand Intelligence...</p>
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
            <h2 className="text-2xl font-bold">Brand Intelligence</h2>
            <p className="text-muted-foreground">
              Help AI understand your brand and website for better content optimization
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {ragStatus?.status === 'ready' && (
            <Button
              variant="outline"
              onClick={refreshKnowledgeBase}
              disabled={false}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(ragStatus?.status || 'not_found')}`} />
            <span>Brand Intelligence Status</span>
          </CardTitle>
          <CardDescription>
            How well AI understands your brand and website content
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
                <span className="font-medium">Pages Learned</span>
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
              
              {ragStatus.status === 'not_found' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    We're learning about your website and brand. This helps AI provide better content suggestions and optimizations. This process runs automatically in the background and should be ready in a few minutes.
                  </AlertDescription>
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
              <span>Brand Understanding Analytics</span>
            </CardTitle>
            <CardDescription>
              How well AI understands your brand for content optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.totalGenerations}</div>
                <div className="text-sm text-muted-foreground">Optimizations Made</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.ragEnhancedCount}</div>
                <div className="text-sm text-muted-foreground">Brand-Enhanced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(analytics.averageRagScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Understanding Score</div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Content Types Optimized</h4>
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
          <TabsTrigger value="overview">How It Works</TabsTrigger>
          <TabsTrigger value="generate">Add Context</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How Brand Intelligence Works</CardTitle>
              <CardDescription>
                Understanding your AI-powered content creation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">1. Learn Your Brand</h4>
                  <p className="text-sm text-muted-foreground">
                    We analyze your website to understand your brand, tone, and style
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">2. Create Smart Content</h4>
                  <p className="text-sm text-muted-foreground">
                    AI generates content that matches your brand voice and style
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">3. Stay Consistent</h4>
                  <p className="text-sm text-muted-foreground">
                    All content maintains your brand identity and messaging
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generate">
          <BrandContextForm 
            siteId={siteId} 
            pageId={pageId}
            onSuccess={(data) => {
              console.log('Brand context added successfully:', data);
              // Optionally reload analytics after adding context
              loadAnalytics();
            }}
            onError={(message) => {
              console.error('Error adding brand context:', message);
            }}
          />
        </TabsContent>
        
        <TabsContent value="settings">
          <RAGSettings siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



// Brand Intelligence Settings Component
function RAGSettings({ siteId }: { siteId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Intelligence Settings</CardTitle>
        <CardDescription>
          Configure how AI understands your brand and content
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