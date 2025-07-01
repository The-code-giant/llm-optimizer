"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { 
  getPageAnalysis, 
  getPageDetails, 
  AnalysisResult, 
  Page, 
  triggerAnalysis,
  getPageContent,
  savePageContent,
  PageContentData
} from "../../../../../lib/api";
import { DashboardLayout } from "../../../../../components/ui/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { Separator } from "../../../../../components/ui/separator";
import { 
  ArrowLeft, 
  Globe, 
  BarChart3, 
  FileText, 
  Calendar, 
  TrendingUp, 
  ExternalLink,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Edit3,
  Plus,
  MessageSquare,
  Type,
  Hash,
  PenTool
} from "lucide-react";
import Link from "next/link";
import Toast from "../../../../../components/Toast";
import ContentEditorModal from "../../../../../components/content-editor-modal";

export default function PageAnalysisPage() {
  const router = useRouter();
  const { siteId, pageId } = useParams() as { siteId: string; pageId: string };
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [pageData, setPageData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Content editing state
  const [editorModal, setEditorModal] = useState<{
    isOpen: boolean;
    contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords';
    currentContent: string;
    title: string;
    description: string;
  } | null>(null);
  
  // Content state (this would normally be persisted in a database)
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    faqs: [] as string[],
    paragraphs: [] as string[],
    keywords: {
      primary: [] as string[],
      longTail: [] as string[],
      semantic: [] as string[],
      missing: [] as string[]
    }
  });

  useEffect(() => {
    // Don't do anything until Clerk has finished loading
    if (!isLoaded) return;
    
    // Only redirect if we're sure the user is not signed in (after Clerk has loaded)
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }
    
    // Make sure we have a pageId
    if (!pageId) {
      router.replace("/dashboard");
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token || !pageId) {
          setError("Failed to get authentication token");
          return;
        }
        
        // Fetch page details, analysis, and saved content
        const [pageDetails, analysisData, savedContent] = await Promise.allSettled([
          getPageDetails(token, pageId),
          getPageAnalysis(token, pageId),
          getPageContent(token, pageId)
        ]);
        
        if (pageDetails.status === 'fulfilled') {
          setPageData(pageDetails.value);
          
          // Initialize content data with saved content or page data
          let initialContentData = {
            title: pageDetails.value?.title || '',
            description: '',
            faqs: [] as string[],
            paragraphs: [] as string[],
            keywords: {
              primary: [] as string[],
              longTail: [] as string[],
              semantic: [] as string[],
              missing: [] as string[]
            }
          };

          // Load saved content if available
          if (savedContent.status === 'fulfilled') {
            const content = savedContent.value.content;
            content.forEach((item: PageContentData) => {
              switch (item.contentType) {
                case 'title':
                  initialContentData.title = item.optimizedContent;
                  break;
                case 'description':
                  initialContentData.description = item.optimizedContent;
                  break;
                case 'faq':
                  initialContentData.faqs.push(item.optimizedContent);
                  break;
                case 'paragraph':
                  initialContentData.paragraphs.push(item.optimizedContent);
                  break;
                case 'keywords':
                  try {
                    initialContentData.keywords = JSON.parse(item.optimizedContent);
                  } catch (e) {
                    console.warn('Failed to parse saved keywords:', e);
                  }
                  break;
              }
            });
          }

          setContentData(initialContentData);
        } else {
          setError("Failed to load page details");
          return;
        }
        
        if (analysisData.status === 'fulfilled') {
          setAnalysis(analysisData.value);
        } else {
          // No analysis yet - this is okay
          setAnalysis(null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load page data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isLoaded, isSignedIn, getToken, pageId, router]);

  async function handleTriggerAnalysis() {
    setTriggering(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token || !pageId) {
        setError("Failed to get authentication token");
        return;
      }
      await triggerAnalysis(token, pageId);
      setToast({ message: "Analysis started! Check back in a few minutes.", type: "success" });
      
      // Refresh analysis result after a delay
      setTimeout(async () => {
        try {
          const token = await getToken();
          if (!token || !pageId) return;
          const data = await getPageAnalysis(token, pageId);
          setAnalysis(data);
          setToast({ message: "Analysis completed!", type: "success" });
        } catch (err) {
          // Analysis might still be processing
          console.log("Analysis still processing...");
        }
      }, 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to trigger analysis";
      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setTriggering(false);
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-green-500">High ({score}%)</Badge>;
    if (score >= 60) return <Badge variant="secondary" className="bg-yellow-500">Medium ({score}%)</Badge>;
    return <Badge variant="destructive">Low ({score}%)</Badge>;
  };

  const openEditor = (
    contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords',
    currentContent: string,
    title: string,
    description: string
  ) => {
    setEditorModal({
      isOpen: true,
      contentType,
      currentContent,
      title,
      description
    });
  };

  const handleContentSave = async (content: string) => {
    if (!editorModal) return;

    const { contentType } = editorModal;
    
    try {
      const token = await getToken();
      if (!token) {
        setToast({ message: "Authentication error", type: "error" });
        return;
      }

      // Get original content for context
      const originalContent = pageData?.title || '';

      // Save to database
      await savePageContent(
        token,
        pageId,
        contentType,
        content,
        originalContent,
        editorModal.description,
        { characterCount: content.length }
      );

      // Update local state
      switch (contentType) {
        case 'title':
          setContentData(prev => ({ ...prev, title: content }));
          break;
        case 'description':
          setContentData(prev => ({ ...prev, description: content }));
          break;
        case 'faq':
          setContentData(prev => ({ 
            ...prev, 
            faqs: [...prev.faqs, content]
          }));
          break;
        case 'paragraph':
          setContentData(prev => ({ 
            ...prev, 
            paragraphs: [...prev.paragraphs, content]
          }));
          break;
        case 'keywords':
          try {
            const keywordData = JSON.parse(content);
            setContentData(prev => ({ ...prev, keywords: keywordData }));
          } catch (error) {
            setToast({ message: "Invalid keyword format", type: "error" });
            return;
          }
          break;
      }

      setToast({ message: `${contentType} saved successfully!`, type: "success" });
    } catch (error: any) {
      setToast({ message: error.message || `Failed to save ${contentType}`, type: "error" });
    }
  };

  const removeFAQ = (index: number) => {
    setContentData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const removeParagraph = (index: number) => {
    setContentData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.filter((_, i) => i !== index)
    }));
  };

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading page details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !pageData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || "Page not found"}</p>
            <Link href={`/dashboard/${siteId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Site
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/${siteId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Site
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Page Content Editor</h1>
              <p className="text-gray-600">AI-powered content optimization and editing</p>
            </div>
          </div>
          <Button 
            onClick={handleTriggerAnalysis}
            disabled={triggering}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {triggering ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {triggering ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>

        {/* Page Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Page Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">URL</label>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-gray-900 break-all">{pageData.url}</p>
                  <a href={pageData.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Original Title</label>
                <p className="text-gray-900 mt-1">{pageData.title || 'No title'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">LLM Readiness Score</label>
                <div className="mt-1">
                  {pageData.llmReadinessScore && pageData.llmReadinessScore > 0 ? (
                    getScoreBadge(Math.round(pageData.llmReadinessScore))
                  ) : (
                    <Badge variant="outline">Not analyzed</Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Scanned</label>
                <p className="text-gray-900 mt-1">
                  {pageData.lastScannedAt ? (
                    new Date(pageData.lastScannedAt).toLocaleDateString()
                  ) : (
                    "Never"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Editing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Content Editors */}
          <div className="space-y-6">
            {/* Title Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Type className="h-5 w-5" />
                    <span>Page Title</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor('title', contentData.title, 'Edit Page Title', 'Generate optimized title suggestions for better SEO and click-through rates')}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">
                    {contentData.title || 'No optimized title set - click Edit to generate suggestions'}
                  </p>
                  {contentData.title && (
                    <div className="mt-2">
                      <Badge variant={contentData.title.length >= 50 && contentData.title.length <= 60 ? "default" : "secondary"}>
                        {contentData.title.length} characters
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Meta Description</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor('description', contentData.description, 'Edit Meta Description', 'Generate compelling meta descriptions that improve search result click-through rates')}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">
                    {contentData.description || 'No meta description set - click Edit to generate suggestions'}
                  </p>
                  {contentData.description && (
                    <div className="mt-2">
                      <Badge variant={contentData.description.length >= 150 && contentData.description.length <= 160 ? "default" : "secondary"}>
                        {contentData.description.length} characters
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>FAQ Section</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor('faq', '', 'Add FAQ', 'Generate frequently asked questions based on page content and user intent')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentData.faqs.length > 0 ? (
                  <div className="space-y-4">
                    {contentData.faqs.map((faq, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-gray-900 whitespace-pre-line">{faq}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFAQ(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No FAQs added yet - click "Add FAQ" to generate suggestions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Paragraphs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PenTool className="h-5 w-5" />
                    <span>Content Paragraphs</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor('paragraph', '', 'Add Content Paragraph', 'Generate optimized content paragraphs to improve page depth and keyword coverage')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Paragraph
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentData.paragraphs.length > 0 ? (
                  <div className="space-y-4">
                    {contentData.paragraphs.map((paragraph, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-gray-900">{paragraph}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParagraph(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PenTool className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No content paragraphs added yet - click "Add Paragraph" to generate suggestions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Keywords & Analysis */}
          <div className="space-y-6">
            {/* Keywords Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-5 w-5" />
                    <span>Keyword Analysis</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor('keywords', JSON.stringify(contentData.keywords, null, 2), 'Keyword Analysis', 'Generate comprehensive keyword analysis including primary, long-tail, semantic, and missing keywords')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Primary Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {contentData.keywords.primary.length > 0 ? 
                        contentData.keywords.primary.map((keyword, index) => (
                          <Badge key={index} variant="default" className="bg-blue-100 text-blue-800">
                            {keyword}
                          </Badge>
                        )) : 
                        <p className="text-gray-500 text-sm">No primary keywords analyzed yet</p>
                      }
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Long-Tail Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {contentData.keywords.longTail.length > 0 ? 
                        contentData.keywords.longTail.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                            {keyword}
                          </Badge>
                        )) : 
                        <p className="text-gray-500 text-sm">No long-tail keywords analyzed yet</p>
                      }
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Semantic Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {contentData.keywords.semantic.length > 0 ? 
                        contentData.keywords.semantic.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="border-purple-300 text-purple-700">
                            {keyword}
                          </Badge>
                        )) : 
                        <p className="text-gray-500 text-sm">No semantic keywords analyzed yet</p>
                      }
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Missing Opportunities</h4>
                    <div className="flex flex-wrap gap-2">
                      {contentData.keywords.missing.length > 0 ? 
                        contentData.keywords.missing.map((keyword, index) => (
                          <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                            {keyword}
                          </Badge>
                        )) : 
                        <p className="text-gray-500 text-sm">No missing keywords identified yet</p>
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analysis Results</span>
                </CardTitle>
                <CardDescription>
                  Latest AI-powered analysis and optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Summary
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{analysis.summary}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Issues */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                        Issues Found
                      </h3>
                      {analysis.issues.length > 0 ? (
                        <ul className="space-y-2">
                          {analysis.issues.map((issue, i) => (
                            <li key={i} className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>No issues found!</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-500" />
                        Recommendations
                      </h3>
                      {analysis.recommendations.length > 0 ? (
                        <ul className="space-y-2">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No specific recommendations at this time.</p>
                      )}
                    </div>

                    {/* Analysis Metadata */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Analysis generated: {new Date(analysis.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Run an analysis to get AI-powered insights and optimization recommendations for this page.
                    </p>
                    <Button onClick={handleTriggerAnalysis} disabled={triggering}>
                      {triggering ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run First Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content Editor Modal */}
      {editorModal && (
        <ContentEditorModal
          isOpen={editorModal.isOpen}
          onClose={() => setEditorModal(null)}
          pageId={pageId}
          contentType={editorModal.contentType}
          currentContent={editorModal.currentContent}
          onSave={handleContentSave}
          title={editorModal.title}
          description={editorModal.description}
        />
      )}
    </DashboardLayout>
  );
} 