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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
  BarChart3,
  FileText,
  MessageSquare,
  Hash,
  Code,
  Type,
  Play,
  Square
} from "lucide-react";
import Toast from "./Toast";
import { 
  getDeployedPageContent, 
  getPageContent, 
  deployPageContent, 
  undeployPageContent,
  DeployedContent,
  PageContentData
} from "../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

interface PageContentDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageUrl: string;
  pageTitle: string;
}

interface ContentTypeInfo {
  type: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords' | 'schema';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const CONTENT_TYPES: ContentTypeInfo[] = [
  {
    type: 'title',
    label: 'Page Title',
    icon: Type,
    description: 'SEO-optimized page title',
    color: 'blue'
  },
  {
    type: 'description',
    label: 'Meta Description',
    icon: FileText,
    description: 'Page meta description for search results',
    color: 'green'
  },
  {
    type: 'keywords',
    label: 'Keywords',
    icon: Hash,
    description: 'SEO keywords and phrases',
    color: 'purple'
  },
  {
    type: 'faq',
    label: 'FAQ Section',
    icon: MessageSquare,
    description: 'Frequently asked questions',
    color: 'orange'
  },
  {
    type: 'paragraph',
    label: 'Content Blocks',
    icon: FileText,
    description: 'Optimized content paragraphs',
    color: 'indigo'
  },
  {
    type: 'schema',
    label: 'Schema Markup',
    icon: Code,
    description: 'Structured data for search engines',
    color: 'red'
  }
];

interface ContentStatus {
  hasContent: boolean;
  isDeployed: boolean;
  content?: PageContentData;
  deployedContent?: DeployedContent;
}

export default function PageContentDeploymentModal({
  isOpen,
  onClose,
  pageId,
  pageUrl,
  pageTitle
}: PageContentDeploymentModalProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contentStatus, setContentStatus] = useState<Record<string, ContentStatus>>({});
  const [deployingType, setDeployingType] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContentStatus();
    }
  }, [isOpen, pageId]);

  const loadContentStatus = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      // Load all content and deployed content
      const [allContent, deployedContent] = await Promise.all([
        getPageContent(token, pageId),
        getDeployedPageContent(token, pageId)
      ]);

      // Build status map
      const statusMap: Record<string, ContentStatus> = {};
      
      for (const contentType of CONTENT_TYPES) {
        const content = allContent.content.find(c => c.contentType === contentType.type);
        const deployed = deployedContent.deployedContent.find(d => d.contentType === contentType.type);
        
        statusMap[contentType.type] = {
          hasContent: !!content,
          isDeployed: !!deployed,
          content,
          deployedContent: deployed
        };
      }

      setContentStatus(statusMap);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to load content status', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (contentType: string) => {
    setDeployingType(contentType);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await deployPageContent(token, pageId, contentType as any);
      
      setToast({ 
        message: `${CONTENT_TYPES.find(t => t.type === contentType)?.label} deployed successfully!`, 
        type: 'success' 
      });

      // Refresh content status
      await loadContentStatus();
      
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to deploy content', 
        type: 'error' 
      });
    } finally {
      setDeployingType(null);
    }
  };

  const handleUndeploy = async (contentType: string) => {
    setDeployingType(contentType);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await undeployPageContent(token, pageId, contentType as any);
      
      setToast({ 
        message: `${CONTENT_TYPES.find(t => t.type === contentType)?.label} undeployed successfully`, 
        type: 'success' 
      });

      // Refresh content status
      await loadContentStatus();
      
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to undeploy content', 
        type: 'error' 
      });
    } finally {
      setDeployingType(null);
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    if (status.isDeployed) {
      return <Badge className="bg-green-100 text-green-800">Deployed</Badge>;
    } else if (status.hasContent) {
      return <Badge variant="secondary">Draft</Badge>;
    } else {
      return <Badge variant="outline">No Content</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Content Deployment</span>
            </DialogTitle>
            <DialogDescription>
              Manage deployed content for <strong>{pageTitle}</strong>
              <br />
              <span className="text-xs text-gray-500">{pageUrl}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading content status...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {CONTENT_TYPES.map((contentType) => {
                  const status = contentStatus[contentType.type] || { hasContent: false, isDeployed: false };
                  const IconComponent = contentType.icon;
                  
                  return (
                    <Card key={contentType.type} className="border-l-4" style={{ borderLeftColor: `var(--${contentType.color}-500)` }}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-${contentType.color}-100`}>
                              <IconComponent className={`h-5 w-5 text-${contentType.color}-600`} />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">{contentType.label}</h3>
                              <p className="text-xs text-gray-600">{contentType.description}</p>
                              {status.deployedContent && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Deployed: {formatDate(status.deployedContent.deployedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(status)}
                            
                            {status.hasContent && (
                              <div className="flex space-x-2">
                                {status.isDeployed ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUndeploy(contentType.type)}
                                    disabled={deployingType === contentType.type}
                                  >
                                    {deployingType === contentType.type ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                    ) : (
                                      <Square className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Undeploy</span>
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeploy(contentType.type)}
                                    disabled={deployingType === contentType.type}
                                  >
                                    {deployingType === contentType.type ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Deploy</span>
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            {!status.hasContent && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                              >
                                No Content
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {status.deployedContent && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {status.deployedContent.optimizedContent}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
                    <li>• Deploy content during low-traffic periods</li>
                    <li>• Test deployed content on your website</li>
                    <li>• Monitor analytics after deployment</li>
                    <li>• Keep backup versions of your original content</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={() => window.open(pageUrl, '_blank')}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Page</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
} 