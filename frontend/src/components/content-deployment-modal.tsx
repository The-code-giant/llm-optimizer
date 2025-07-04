"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  Globe, 
  Check, 
  Send, 
  Calendar,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap,
  BarChart3
} from "lucide-react";
import Toast from "./Toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

interface ContentDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
  pageId?: string;
  initialUrl?: string;
}

interface DeploymentContent {
  title?: string;
  description?: string;
  keywords?: string;
  faq?: string;
}

interface DeploymentPreview {
  url: string;
  content: DeploymentContent;
  isActive: boolean;
  lastDeployed?: string;
  performance?: {
    views: number;
    ctr: number;
    avgLoadTime: number;
  };
}

export default function ContentDeploymentModal({
  isOpen,
  onClose,
  siteId,
  siteName,
  pageId,
  initialUrl = ""
}: ContentDeploymentModalProps) {
  const { getToken } = useAuth();
  const [deploymentUrl, setDeploymentUrl] = useState(initialUrl);
  const [content, setContent] = useState<DeploymentContent>({});
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [existingDeployments, setExistingDeployments] = useState<DeploymentPreview[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadExistingContent();
      loadExistingDeployments();
    }
  }, [isOpen, pageId]);

  const loadExistingContent = async () => {
    if (!pageId) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/pages/${pageId}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load page content');
      }

      const data = await response.json();
      
      // Transform the content data into our format
      const contentMap: DeploymentContent = {};
      data.content?.forEach((item: any) => {
        if (item.contentType === 'title') contentMap.title = item.optimizedContent;
        if (item.contentType === 'description') contentMap.description = item.optimizedContent;
        if (item.contentType === 'keywords') contentMap.keywords = item.optimizedContent;
        if (item.contentType === 'faq') contentMap.faq = item.optimizedContent;
      });

      setContent(contentMap);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to load content', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingDeployments = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/sites/${siteId}/deployments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExistingDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error('Failed to load existing deployments:', error);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeploy = async () => {
    if (!deploymentUrl.trim()) {
      setToast({ message: 'Please enter a URL', type: 'error' });
      return;
    }

    if (!validateUrl(deploymentUrl)) {
      setToast({ message: 'Please enter a valid URL', type: 'error' });
      return;
    }

    const hasContent = Object.values(content).some(value => value?.trim());
    if (!hasContent) {
      setToast({ message: 'Please add some content to deploy', type: 'error' });
      return;
    }

    setDeploying(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/sites/${siteId}/deploy-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: deploymentUrl,
          content: content,
          pageId: pageId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to deploy content');
      }

      const result = await response.json();
      
      setToast({ 
        message: 'Content deployed successfully! Changes will be live within minutes.', 
        type: 'success' 
      });

      // Refresh deployments list
      await loadExistingDeployments();
      
      // Reset form
      setDeploymentUrl("");
      if (!pageId) {
        setContent({});
      }
      
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to deploy content', 
        type: 'error' 
      });
    } finally {
      setDeploying(false);
    }
  };

  const toggleDeployment = async (url: string, isActive: boolean) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/sites/${siteId}/deployments/${encodeURIComponent(url)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update deployment');
      }

      setToast({ 
        message: `Deployment ${!isActive ? 'activated' : 'deactivated'} successfully`, 
        type: 'success' 
      });

      // Refresh deployments
      await loadExistingDeployments();
      
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to update deployment', 
        type: 'error' 
      });
    }
  };

  const getContentSummary = (content: DeploymentContent): string => {
    const parts = [];
    if (content.title) parts.push('Title');
    if (content.description) parts.push('Description');
    if (content.keywords) parts.push('Keywords');
    if (content.faq) parts.push('FAQ');
    return parts.length > 0 ? parts.join(', ') : 'No content';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Deploy Content - {siteName}</span>
            </DialogTitle>
            <DialogDescription>
              Deploy optimized content to specific URLs. The content will be injected via your tracking script.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Deployment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>New Deployment</span>
                </CardTitle>
                <CardDescription>
                  Deploy content to a specific URL on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deployment-url">Target URL</Label>
                  <Input
                    id="deployment-url"
                    type="url"
                    placeholder="https://yoursite.com/page-to-optimize"
                    value={deploymentUrl}
                    onChange={(e) => setDeploymentUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Enter the full URL where you want to deploy this content
                  </p>
                </div>

                {/* Content Preview */}
                {Object.keys(content).length > 0 && (
                  <div className="space-y-3">
                    <Label>Content to Deploy</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {content.title && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-sm text-blue-900">Title</h4>
                          <p className="text-xs text-blue-700 mt-1">{content.title}</p>
                        </div>
                      )}
                      {content.description && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-sm text-green-900">Description</h4>
                          <p className="text-xs text-green-700 mt-1">{content.description}</p>
                        </div>
                      )}
                      {content.keywords && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium text-sm text-purple-900">Keywords</h4>
                          <p className="text-xs text-purple-700 mt-1">{content.keywords}</p>
                        </div>
                      )}
                      {content.faq && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <h4 className="font-medium text-sm text-orange-900">FAQ</h4>
                          <p className="text-xs text-orange-700 mt-1 line-clamp-2">{content.faq}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeploy} 
                    disabled={deploying || loading}
                    className="flex items-center space-x-2"
                  >
                    {deploying ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{deploying ? 'Deploying...' : 'Deploy Content'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Deployments */}
            {existingDeployments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    <span>Active Deployments</span>
                    <Badge variant="outline">{existingDeployments.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Manage your deployed content across different URLs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {existingDeployments.map((deployment, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-sm">{deployment.url}</h4>
                              <Badge 
                                variant={deployment.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {deployment.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Content: {getContentSummary(deployment.content)}
                            </p>
                            {deployment.lastDeployed && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last deployed: {new Date(deployment.lastDeployed).toLocaleDateString()}
                              </p>
                            )}
                            {deployment.performance && (
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-gray-600">
                                  Views: {deployment.performance.views}
                                </span>
                                <span className="text-xs text-gray-600">
                                  CTR: {deployment.performance.ctr}%
                                </span>
                                <span className="text-xs text-gray-600">
                                  Load: {deployment.performance.avgLoadTime}ms
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(deployment.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleDeployment(deployment.url, deployment.isActive)}
                            >
                              {deployment.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deployment Tips */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Zap className="h-5 w-5" />
                  <span>Deployment Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700">
                <div className="space-y-2">
                  <p className="text-sm">For best results:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Ensure your tracking script is installed on the target page</li>
                    <li>• Content updates are applied when the page loads</li>
                    <li>• Changes are visible to search engines and crawlers</li>
                    <li>• Monitor performance in the Analytics dashboard</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
} 