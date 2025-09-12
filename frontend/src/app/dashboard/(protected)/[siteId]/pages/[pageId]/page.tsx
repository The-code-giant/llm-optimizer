"use client";
import { useCallback, useEffect, useState } from "react";
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
  PageContentData,
  undeployPageContent,
  getOriginalPageContent,
  getSectionRatings,
} from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator"; // Commented out with Content tab
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Globe,
  BarChart3,
  // FileText, // Commented out with Content tab
  ExternalLink,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  // Clock, // Commented out with Content tab
  Target,
  // Edit3, // Commented out with Content tab
  // Plus, // Commented out with Content tab
  // MessageSquare, // Commented out with Content tab
  Type,
  FileText,
  Database,
  // Hash, // Commented out with Content tab
  // PenTool, // Commented out with Content tab
  // Trash2, // Commented out with Content tab
} from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";
import ContentEditorModal from "@/components/content-editor-modal";
import SectionRatingDisplay from "@/components/SectionRatingDisplay";
import SectionImprovementModal from "@/components/SectionImprovementModal";
// Commented out with Content tab
// import {
//   Accordion,
//   AccordionItem,
//   AccordionTrigger,
//   AccordionContent,
// } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PageAnalysisPage() {
  const router = useRouter();
  const { siteId, pageId } = useParams() as { siteId: string; pageId: string };
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [pageData, setPageData] = useState<Page | null>(null);
  const [sectionRatings, setSectionRatings] = useState<{
    pageId: string;
    sectionRatings: {
      title: number;
      description: number;
      headings: number;
      content: number;
      schema: number;
      images: number;
      links: number;
    };
    sectionRecommendations: {
      title: string[];
      description: string[];
      headings: string[];
      content: string[];
      schema: string[];
      images: string[];
      links: string[];
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Content editing state
  const [editorModal, setEditorModal] = useState<{
    isOpen: boolean;
    contentType: "title" | "description" | "faq" | "paragraph" | "keywords";
    currentContent: string;
    title: string;
    description: string;
  } | null>(null);

  // Modal state
  const [improvementModal, setImprovementModal] = useState<{
    isOpen: boolean;
    sectionType: string;
    recommendations: string[];
    currentScore: number;
  } | null>(null);

  // Content state (this would normally be persisted in a database)
  // Commented out with Content tab
  // const [contentData] = useState({
  //   title: "",
  //   description: "",
  //   faqs: [] as string[],
  //   paragraphs: [] as string[],
  //   keywords: {
  //     primary: [] as string[],
  //     longTail: [] as string[],
  //     semantic: [] as string[],
  //     missing: [] as string[],
  //   },
  // });

  // Add state for original meta description
  const [originalMetaDescription, setOriginalMetaDescription] =
    useState<string>("");

  // Add state for all content versions
  const [contentVersions, setContentVersions] = useState<{
    [type: string]: PageContentData[];
  }>({});

  // 1. Add state for undeploy dialog
  const [undeployDialog, setUndeployDialog] = useState<{
    open: boolean;
    contentType:
      | "title"
      | "description"
      | "faq"
      | "paragraph"
      | "keywords"
      | null;
  }>({ open: false, contentType: null });
  const [undeploying, setUndeploying] = useState(false);

  // Add scroll functionality
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Check if content is deployed for a section
  const isContentDeployed = (contentType: string) => {
    const content = contentVersions[contentType];
    const isDeployed = content?.some(item => item.isActive === 1) || false;
    return isDeployed;
  };

  // Move fetchData to top-level scope so it can be called from handleUndeploy
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token || !pageId) {
        setError("Failed to get authentication token");
        return;
      }
      // Fetch page details, analysis, saved content, section ratings, and original meta description
      const [pageDetails, analysisData, savedContent, sectionRatingsData, originalContentResult] =
        await Promise.allSettled([
          getPageDetails(token, pageId),
          getPageAnalysis(token, pageId),
          getPageContent(token, pageId),
          getSectionRatings(token, pageId),
          getOriginalPageContent(token, pageId),
        ]);
      if (originalContentResult.status === "fulfilled") {
        setOriginalMetaDescription(
          originalContentResult.value.originalContent?.metaDescription || ""
        );
      }
      if (pageDetails.status === "fulfilled") {
        setPageData(pageDetails.value);
      } else {
        setError("Failed to load page details");
        return;
      }
      if (savedContent.status === "fulfilled") {
        const content = savedContent.value.content;
        const grouped: { [type: string]: PageContentData[] } = {
          title: [],
          description: [],
          faq: [],
          paragraph: [],
          keywords: [],
          schema: [],
        };
        // Safety check: ensure content is an array before calling forEach
        if (Array.isArray(content)) {
          content.forEach((item: PageContentData) => {
            if (grouped[item.contentType]) grouped[item.contentType].push(item);
          });
        }
        setContentVersions(grouped);
      }
      if (analysisData.status === "fulfilled") {
        setAnalysis(analysisData.value);
      } else {
        setAnalysis(null);
      }
      if (sectionRatingsData.status === "fulfilled") {
        setSectionRatings(sectionRatingsData.value);
      } else {
        setSectionRatings(null);
      }
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load page data");
      setLoading(false);
    }
  }, [getToken, pageId]);

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

    fetchData();
  }, [isLoaded, isSignedIn, router, fetchData, pageId]);

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
      setToast({
        message: "Analysis started! Check back in a few minutes.",
        type: "success",
      });

      // Refresh analysis result after a delay
      setTimeout(async () => {
        try {
          const token = await getToken();
          if (!token || !pageId) return;
          const data = await getPageAnalysis(token, pageId);
          setAnalysis(data);
          setToast({ message: "Analysis completed!", type: "success" });
        } catch {
          // Analysis might still be processing
        }
      }, 5000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to trigger analysis";
      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setTriggering(false);
    }
  }

  // Commented out with Content tab
  // const getScoreBadge = (score: number) => {
  //   if (score >= 80)
  //     return (
  //       <Badge variant="default" className="bg-green-500">
  //         High ({score}%)
  //       </Badge>
  //     );
  //   if (score >= 60)
  //     return (
  //       <Badge variant="secondary" className="bg-yellow-500">
  //         Medium ({score}%)
  //       </Badge>
  //     );
  //   return <Badge variant="destructive">Low ({score}%)</Badge>;
  // };

  // Commented out with Content tab
  // const openEditor = (
  //   contentType: "title" | "description" | "faq" | "paragraph" | "keywords",
  //   currentContent: string,
  //   title: string,
  //   description: string
  // ) => {
  //   setEditorModal({
  //     isOpen: true,
  //     contentType,
  //     currentContent,
  //     title,
  //     description,
  //   });
  // };

  const handleContentSave = async (
    content: string,
    deployImmediately?: boolean
  ) => {
    if (!editorModal) return;
    const { contentType } = editorModal;
    try {
      const token = await getToken();
      if (!token) {
        setToast({ message: "Authentication error", type: "error" });
        return;
      }
      // Get correct original content for context
      let originalContent = "";
      if (contentType === "title") {
        originalContent = pageData?.title || "";
      } else if (contentType === "description") {
        originalContent = originalMetaDescription || "";
      } else {
        originalContent = "";
      }
      // Save to database (with deployImmediately if requested)
      const response = await savePageContent(
        token,
        pageId,
        contentType,
        content,
        originalContent,
        editorModal.description,
        { characterCount: content.length },
        deployImmediately
      );
      // Optimistically update contentVersions with the new deployed content if deployImmediately
      if (response && response.content && deployImmediately) {
        setContentVersions((prev) => {
          const updated = { ...prev };
          // Remove any previous deployed version (isActive: 1) for this type
          const filtered = (prev[contentType] || []).filter(
            (c) => c.id !== response.content.id && c.isActive !== 1
          );
          updated[contentType] = [response.content, ...filtered];
          return updated;
        });
      } else {
        // If not deploying, refresh all data to ensure consistency
        await fetchData();
      }
      setToast({
        message: `${contentType} saved${
          deployImmediately ? " and deployed" : ""
        } successfully!`,
        type: "success",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to save${
              deployImmediately ? " and deploy" : ""
            } ${contentType}`;
      setToast({ message, type: "error" });
    }
  };

  // 2. Add undeploy handler
  const handleUndeploy = async (
    contentType: "title" | "description" | "faq" | "paragraph" | "keywords"
  ) => {
    setUndeploying(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await undeployPageContent(token, pageId, contentType);
      await fetchData(); // Refresh content from backend
      setToast({
        message: `${
          contentType.charAt(0).toUpperCase() + contentType.slice(1)
        } undeployed successfully!`,
        type: "success",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to undeploy content";
      setToast({ message, type: "error" });
    } finally {
      setUndeploying(false);
      setUndeployDialog({ open: false, contentType: null });
    }
  };

  if (!isLoaded || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading page details...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
  if (error || !pageData) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                      <p className="text-destructive mb-4">{error || "Page not found"}</p>
                      <Link href={`/dashboard/${siteId}`}>
                        <Button variant="outline">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Site
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }


  // In the render logic for each content type (e.g., title, description):
  const deployedTitle = (contentVersions.title || []).find(
    (c) => c.isActive === 1
  );
  const deployedDescription = (contentVersions.description || []).find(
    (c) => c.isActive === 1
  );

  // In the render logic for FAQ section:
  const deployedFAQ = (contentVersions.faq || []).find((c) => c.isActive === 1);

  // Find deployed paragraph
  const deployedParagraph = (contentVersions.paragraph || []).find(
    (c) => c.isActive === 1
  );
  const hasAnyDeployed = Boolean(
    deployedTitle || deployedDescription || deployedFAQ || deployedParagraph
  );
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SiteHeader />
              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type}
                  onClose={() => setToast(null)}
                />
              )}

              <div className="px-4 lg:px-6">
                <div className="space-y-6">
                  {/* Sticky Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-start gap-3">
                      <Link href={`/dashboard/${siteId}`}>
                        <Button variant="ghost" className="p-2">
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="text-xl md:text-2xl font-semibold">
                            Page Details
                          </h1>
                          {hasAnyDeployed ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Deployed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Draft
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <a
                            href={pageData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline overflow-hidden text-ellipsis whitespace-nowrap max-w-[220px] md:max-w-[420px] lg:max-w-none"
                          >
                            {pageData.url}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full sm:w-auto">
                            <Button
                              onClick={handleTriggerAnalysis}
                              // disabled={triggering || Boolean(analysis && (analysis.recommendations.length > 0 || analysis.issues.length > 0))}
                              className={`w-full sm:w-auto whitespace-nowrap ${
                                analysis &&
                                (analysis.recommendations.length > 0 ||
                                  analysis.issues.length > 0)
                                  ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {triggering ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              <span className="sm:hidden">Analyze</span>
                              <span className="hidden sm:inline">
                                {analysis &&
                                (analysis.recommendations.length > 0 ||
                                  analysis.issues.length > 0)
                                  ? "Already Analyzed"
                                  : analysis
                                  ? "Run Analysis Again"
                                  : "Run First Analysis"}
                              </span>
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Analyze the page and refresh insights
                        </TooltipContent>
                      </Tooltip>
                      <a
                        href={pageData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto"
                      >
                        <Button
                          variant="outline"
                          className="gap-2 w-full sm:w-auto whitespace-nowrap"
                        >
                          <ExternalLink className="h-4 w-4" /> View Live
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Onboarding / Next-step helper */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        How to Improve Your Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                          Each section is scored from 0-10. Click &quot;Improve
                          This Section&quot; to see AI-generated content
                          suggestions that can boost your scores.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-green-600 font-semibold">
                              8-10
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Excellent
                            </div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-yellow-600 font-semibold">
                              6-7
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Good
                            </div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-red-600 font-semibold">
                              0-5
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Needs Work
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Your Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground text-xs">
                          Click any task to jump to that section.
                        </p>
                        <div className="space-y-2">
                          {/* Title Task */}
                          <div 
                            className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => scrollToSection('title-section')}
                          >
                            <div className="flex items-center gap-2">
                              <Type className="h-3 w-3 text-blue-500" />
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">Optimize Page Title</span>
                                <span className="text-xs text-muted-foreground">
                                  {sectionRatings?.sectionRatings?.title || 0}/10
                                </span>
                              </div>
                            </div>
                            {isContentDeployed('title') ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>

                          {/* Description Task */}
                          <div 
                            className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => scrollToSection('description-section')}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-green-500" />
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">Improve Meta Description</span>
                                <span className="text-xs text-muted-foreground">
                                  {sectionRatings?.sectionRatings?.description || 0}/10
                                </span>
                              </div>
                            </div>
                            {isContentDeployed('description') ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>

                          {/* Schema Task */}
                          <div 
                            className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => scrollToSection('schema-section')}
                          >
                            <div className="flex items-center gap-2">
                              <Database className="h-3 w-3 text-red-500" />
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">Add Schema Markup</span>
                                <span className="text-xs text-muted-foreground">
                                  {sectionRatings?.sectionRatings?.schema || 0}/10
                                </span>
                              </div>
                            </div>
                            {isContentDeployed('schema') ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                  {/* Tabs */}
                  <Tabs defaultValue="Content" className="w-full">
                    <TabsList className="mt-2">
                      <TabsTrigger value="Content">Content</TabsTrigger>
                      <TabsTrigger value="Overview">Overview</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="Overview" className="mt-4 space-y-6">
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
                              <label className="text-sm font-medium text-muted-foreground">
                                URL
                              </label>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="break-all">{pageData.url}</p>
                                <a
                                  href={pageData.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Original Title
                              </label>
                              <p className="mt-1">
                                {pageData.title || "No title"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                LLM Readiness Score
                              </label>
                              <div className="mt-1 flex items-center gap-2">
                                {analysis?.summary ? (() => {
                                  try {
                                    return JSON.parse(analysis.summary).score || 0;
                                  } catch {
                                    return analysis?.score || 0;
                                  }
                                })() : (analysis?.score || 0)}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-muted-foreground underline decoration-dotted cursor-help">
                                      What is this?
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    An estimate of how well the page content is
                                    structured for AI assistants.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Last Scanned
                              </label>
                              <p className="mt-1">
                                {pageData.lastScannedAt
                                  ? new Date(
                                      pageData.lastScannedAt
                                    ).toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Content Tab */}
                    {/* <TabsContent value="content" className="mt-4 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        // Left Column - Content Editors
                        <div className="space-y-6">
                          // Title Editor
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Type className="h-5 w-5" />
                                  <span>Page Title</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditor(
                                        "title",
                                        contentData.title ||
                                          pageData.title ||
                                          "",
                                        "Edit Page Title",
                                        "Generate optimized title suggestions for better SEO and click-through rates"
                                      )
                                    }
                                    disabled={!analysis}
                                    className={
                                      !analysis
                                        ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                        : ""
                                    }
                                  >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  {deployedTitle && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setUndeployDialog({
                                          open: true,
                                          contentType: "title",
                                        })
                                      }
                                      disabled={undeploying}
                                      className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Undeploy
                                    </Button>
                                  )}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="p-4 bg-muted rounded-lg flex flex-col gap-2">
                                <p className="font-medium">
                                  {deployedTitle
                                    ? deployedTitle.optimizedContent
                                    : pageData?.title ||
                                      "No title set - click Edit to generate suggestions"}
                                </p>
                                {!analysis && (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    Run analysis to enable editing.
                                  </div>
                                )}
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    className={
                                      (deployedTitle
                                        ? deployedTitle.optimizedContent.length
                                        : pageData?.title?.length || 0) >= 50 &&
                                      (deployedTitle
                                        ? deployedTitle.optimizedContent.length
                                        : pageData?.title?.length || 0) <= 60
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {deployedTitle
                                      ? deployedTitle.optimizedContent.length
                                      : pageData?.title?.length || 0}{" "}
                                    characters
                                  </Badge>
                                  {deployedTitle ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                      Deployed
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground border-muted"
                                    >
                                      Not Deployed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          // Description Editor
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-5 w-5" />
                                  <span>Meta Description</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditor(
                                        "description",
                                        contentData.description ||
                                          originalMetaDescription ||
                                          "",
                                        "Edit Meta Description",
                                        "Generate compelling meta descriptions that improve search result click-through rates"
                                      )
                                    }
                                    disabled={!analysis}
                                    className={
                                      !analysis
                                        ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                        : ""
                                    }
                                  >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  {deployedDescription && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setUndeployDialog({
                                          open: true,
                                          contentType: "description",
                                        })
                                      }
                                      disabled={undeploying}
                                      className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Undeploy
                                    </Button>
                                  )}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="">
                                  {deployedDescription
                                    ? deployedDescription.optimizedContent
                                    : originalMetaDescription ||
                                      "No meta description set - click Edit to generate suggestions"}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    className={
                                      deployedDescription &&
                                      deployedDescription.optimizedContent
                                        .length >= 150 &&
                                      deployedDescription.optimizedContent
                                        .length <= 160
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {deployedDescription
                                      ? deployedDescription.optimizedContent
                                          .length
                                      : originalMetaDescription?.length ||
                                        0}{" "}
                                    characters
                                  </Badge>
                                  {deployedDescription ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                      Deployed
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground border-muted"
                                    >
                                      Not Deployed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          // FAQ Section
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <MessageSquare className="h-5 w-5" />
                                  <span>FAQ Section</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditor(
                                        "faq",
                                        contentData.faqs[
                                          contentData.faqs.length - 1
                                        ] || "",
                                        "Add FAQ",
                                        "Generate frequently asked questions based on page content and user intent"
                                      )
                                    }
                                    disabled={!analysis}
                                    className={
                                      !analysis
                                        ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                        : ""
                                    }
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add FAQ
                                  </Button>
                                  {deployedFAQ && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setUndeployDialog({
                                          open: true,
                                          contentType: "faq",
                                        })
                                      }
                                      disabled={undeploying}
                                      className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Undeploy
                                    </Button>
                                  )}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {deployedFAQ ? (
                                <Accordion type="multiple" className="w-full">
                                  {(() => {
                                    let faqs: {
                                      question: string;
                                      answer: string;
                                    }[] = [];
                                    try {
                                      faqs = JSON.parse(
                                        deployedFAQ.optimizedContent
                                      );
                                    } catch {}
                                    return faqs.map((item, i) => (
                                      <AccordionItem
                                        key={i}
                                        value={`faq-${i}`}
                                        className="mb-2"
                                      >
                                        <AccordionTrigger className="px-4 py-2 text-left font-semibold">
                                          {item.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 flex flex-col gap-2">
                                          <p className="text-gray-700 whitespace-pre-line">
                                            {item.answer}
                                          </p>
                                        </AccordionContent>
                                      </AccordionItem>
                                    ));
                                  })()}
                                </Accordion>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                  <p>
                                    No FAQs added yet - click &quot;Add
                                    FAQ&quot; to generate suggestions
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          // Content Paragraphs
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <PenTool className="h-5 w-5" />
                                  <span>Content Paragraphs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditor(
                                        "paragraph",
                                        deployedParagraph
                                          ? deployedParagraph.optimizedContent
                                          : "",
                                        "Add Content Paragraph",
                                        "Generate optimized content paragraphs to improve page depth and keyword coverage"
                                      )
                                    }
                                    disabled={!analysis}
                                    className={
                                      !analysis
                                        ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                        : ""
                                    }
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Paragraph
                                  </Button>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {deployedParagraph ? (
                                (() => {
                                  let paragraphs: Array<
                                    | string
                                    | { heading?: string; content: string }
                                  > = [];
                                  try {
                                    paragraphs = JSON.parse(
                                      deployedParagraph.optimizedContent
                                    );
                                  } catch {
                                    paragraphs = [
                                      deployedParagraph.optimizedContent,
                                    ];
                                  }
                                  return (
                                    <div className="space-y-4">
                                      {paragraphs.map(
                                        (
                                          para:
                                            | string
                                            | {
                                                heading?: string;
                                                content: string;
                                              },
                                          idx: number
                                        ) =>
                                          typeof para === "object" &&
                                          para !== null ? (
                                            <div
                                              key={idx}
                                              className="p-4 bg-muted rounded-lg"
                                            >
                                              {para.heading && (
                                                <div className="font-semibold mb-1">
                                                  {para.heading}
                                                </div>
                                              )}
                                              <div className="whitespace-pre-line">
                                                {
                                                  (para as { content: string })
                                                    .content
                                                }
                                              </div>
                                            </div>
                                          ) : (
                                            <div
                                              key={idx}
                                              className="p-4 bg-muted rounded-lg whitespace-pre-line"
                                            >
                                              {para}
                                            </div>
                                          )
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <PenTool className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                  <p>
                                    No paragraphs deployed yet - click &quot;Add
                                    Paragraph&quot; to generate suggestions
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        // Right Column - Keywords
                        <div className="space-y-6">
                          // Keywords Section
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Hash className="h-5 w-5" />
                                  <span>Keyword Analysis</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditor(
                                        "keywords",
                                        JSON.stringify(
                                          contentData.keywords,
                                          null,
                                          2
                                        ),
                                        "Keyword Analysis",
                                        "Generate comprehensive keyword analysis including primary, long-tail, semantic, and missing keywords"
                                      )
                                    }
                                    disabled={Boolean(
                                      analysis &&
                                        (analysis.recommendations.length > 0 ||
                                          analysis.issues.length > 0)
                                    )}
                                    className={
                                      analysis &&
                                      (analysis.recommendations.length > 0 ||
                                        analysis.issues.length > 0)
                                        ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                                        : ""
                                    }
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {analysis &&
                                    (analysis.recommendations.length > 0 ||
                                      analysis.issues.length > 0)
                                      ? "Already Analyzed"
                                      : "Analyze"}
                                  </Button>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Primary Keywords
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {contentData.keywords.primary.length > 0 ? (
                                      contentData.keywords.primary.map(
                                        (keyword, index) => (
                                          <Badge
                                            key={index}
                                            variant="default"
                                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                          >
                                            {keyword}
                                          </Badge>
                                        )
                                      )
                                    ) : (
                                      <p className="text-muted-foreground text-sm">
                                        No primary keywords analyzed yet
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Long-Tail Keywords
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {contentData.keywords.longTail.length >
                                    0 ? (
                                      contentData.keywords.longTail.map(
                                        (keyword, index) => (
                                          <Badge
                                            key={index}
                                            variant="secondary"
                                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                          >
                                            {keyword}
                                          </Badge>
                                        )
                                      )
                                    ) : (
                                      <p className="text-muted-foreground text-sm">
                                        No long-tail keywords analyzed yet
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Semantic Keywords
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {contentData.keywords.semantic.length >
                                    0 ? (
                                      contentData.keywords.semantic.map(
                                        (keyword, index) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                                          >
                                            {keyword}
                                          </Badge>
                                        )
                                      )
                                    ) : (
                                      <p className="text-muted-foreground text-sm">
                                        No semantic keywords analyzed yet
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Missing Opportunities
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {contentData.keywords.missing.length > 0 ? (
                                      contentData.keywords.missing.map(
                                        (keyword, index) => (
                                          <Badge
                                            key={index}
                                            variant="destructive"
                                            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                          >
                                            {keyword}
                                          </Badge>
                                        )
                                      )
                                    ) : (
                                      <p className="text-muted-foreground text-sm">
                                        No missing keywords identified yet
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        // Close grid wrapper
                      </div>
                    </TabsContent> */}

                    {/* Analysis Tab */}
                    <TabsContent value="Content" className="mt-4 space-y-6">
                      {analysis ? (
                        <>
                          {/* Section Ratings */}
                          {sectionRatings && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                  <Target className="h-5 w-5" />
                                  <span>Section Ratings</span>
                                </CardTitle>
                                <CardDescription>
                                  Detailed scores for each SEO section with AI
                                  recommendations
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <SectionRatingDisplay
                                  pageId={pageId}
                                  sectionRatings={sectionRatings?.sectionRatings}
                                  sectionRecommendations={sectionRatings?.sectionRecommendations}
                                  overallScore={analysis?.score || 0}
                                  onImproveSection={(
                                    sectionType,
                                    recommendations
                                  ) => {
                                    setImprovementModal({
                                      isOpen: true,
                                      sectionType,
                                      recommendations,
                                      currentScore: sectionRatings?.sectionRatings?.[
                                        sectionType as keyof typeof sectionRatings.sectionRatings
                                      ] || 0,
                                    });
                                  }}
                                />
                              </CardContent>
                            </Card>
                          )}

                          {/* Section Improvement Modal */}
                          {improvementModal && (
                            <SectionImprovementModal
                              isOpen={improvementModal.isOpen}
                              pageId={pageId}
                              sectionType={improvementModal.sectionType}
                              recommendations={improvementModal.recommendations}
                              currentScore={improvementModal.currentScore}
                              onClose={() => setImprovementModal(null)}
                              onContentGenerated={async (
                                content: string,
                                newScore: number
                              ) => {
                                try {
                                  const token = await getToken();
                                  if (!token) {
                                    setToast({
                                      message: "Authentication error",
                                      type: "error",
                                    });
                                    return;
                                  }

                                  setToast({
                                    message: `${improvementModal.sectionType} section improved from ${improvementModal.currentScore}/10 to ${newScore}/10!`,
                                    type: "success",
                                  });

                                  // Refresh section ratings data to get updated scores
                                  try {
                                    const updatedSectionRatings = await getSectionRatings(token, pageId);
                                    setSectionRatings(updatedSectionRatings);
                                  } catch (error) {
                                    console.error('Failed to refresh section ratings:', error);
                                    // Fallback: refresh all data
                                    await fetchData();
                                  }

                                  // Refresh page content data to update task completion status
                                  try {
                                    const updatedContent = await getPageContent(token, pageId);
                                    const content = updatedContent.content;
                                    const grouped: { [type: string]: PageContentData[] } = {
                                      title: [],
                                      description: [],
                                      faq: [],
                                      paragraph: [],
                                      keywords: [],
                                      schema: [],
                                    };
                                    if (Array.isArray(content)) {
                                      content.forEach((item: PageContentData) => {
                                        if (grouped[item.contentType]) grouped[item.contentType].push(item);
                                      });
                                    }
                                    setContentVersions(grouped);
                                  } catch (error) {
                                    console.error('Failed to refresh page content:', error);
                                    // Fallback: refresh all data
                                    await fetchData();
                                  }

                                  // Also refresh analysis data to get updated overall score
                                  try {
                                    const updatedAnalysis = await getPageAnalysis(token, pageId);
                                    setAnalysis(updatedAnalysis);
                                  } catch (error) {
                                    console.error('Failed to refresh analysis:', error);
                                    // Fallback: refresh all data
                                    await fetchData();
                                  }
                                  
                                  setImprovementModal(null);
                                } catch (error) {
                                  const message =
                                    error instanceof Error
                                      ? error.message
                                      : "Failed to update section rating";
                                  setToast({ message, type: "error" });
                                }
                              }}
                            />
                          )}

                          {/* Analysis Results */}
                          {/* <Card>
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
                              <div className="space-y-6">
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <FileText className="h-5 w-5 mr-2" />
                                    Summary
                                  </h3>
                                  <div className="bg-muted rounded-lg p-4">
                                    <p className="text-foreground">{analysisJson?.summary}</p>
                                  </div>
                                </div>

                                <Separator />

                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                                    Issues Found
                                  </h3>
                                  {analysis.issues.length > 0 ? (
                                    <ul className="space-y-2">
                                      {analysis.issues.map((issue, i) => (
                                        <li key={i} className="flex items-start space-x-3">
                                          <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                                          <span className="text-foreground">{issue}</span>
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

                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <Target className="h-5 w-5 mr-2 text-primary" />
                                    Recommendations
                                  </h3>
                                  {analysis.recommendations.length > 0 ? (
                                    <ul className="space-y-2">
                                      {analysis.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start space-x-3">
                                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                          <span className="text-foreground">{rec}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-muted-foreground">No specific recommendations at this time.</p>
                                  )}
                                </div>

                                <div className="pt-4 border-t border-border">
                                  <p className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Analysis generated: {new Date(analysis.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card> */}
                        </>
                      ) : (
                        <Card>
                          <CardContent className="text-center py-8">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                              No Analysis Yet
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              Run an analysis to get AI-powered insights and
                              optimization recommendations for this page.
                            </p>
                            <Button
                              onClick={handleTriggerAnalysis}
                              disabled={triggering}
                            >
                              {triggering ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              Run First Analysis
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
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

                {/* Undeploy Confirmation Dialog */}
                <Dialog
                  open={undeployDialog.open}
                  onOpenChange={(open) =>
                    setUndeployDialog((d) => ({ ...d, open }))
                  }
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Undeploy</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to undeploy this{" "}
                        {undeployDialog.contentType}? This will revert to the
                        original version.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setUndeployDialog({ open: false, contentType: null })
                        }
                        disabled={undeploying}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleUndeploy(undeployDialog.contentType!)
                        }
                        disabled={undeploying}
                      >
                        {undeploying ? "Undeploying..." : "Confirm Undeploy"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
