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
  PageContentData,
  undeployPageContent,
  getOriginalPageContent,
} from "@/lib/api";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Globe,
  BarChart3,
  FileText,
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
  PenTool,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";
import ContentEditorModal from "@/components/content-editor-modal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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

  // Content state (this would normally be persisted in a database)
  const [contentData, setContentData] = useState({
    title: "",
    description: "",
    faqs: [] as string[],
    paragraphs: [] as string[],
    keywords: {
      primary: [] as string[],
      longTail: [] as string[],
      semantic: [] as string[],
      missing: [] as string[],
    },
  });

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

  // Move fetchData to top-level scope so it can be called from handleUndeploy
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token || !pageId) {
        setError("Failed to get authentication token");
        return;
      }
      // Fetch page details, analysis, saved content, and original meta description
      const [pageDetails, analysisData, savedContent, originalContentResult] =
        await Promise.allSettled([
          getPageDetails(token, pageId),
          getPageAnalysis(token, pageId),
          getPageContent(token, pageId),
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
        };
        content.forEach((item: PageContentData) => {
          if (grouped[item.contentType]) grouped[item.contentType].push(item);
        });
        setContentVersions(grouped);
      }
      if (analysisData.status === "fulfilled") {
        setAnalysis(analysisData.value);
      } else {
        setAnalysis(null);
      }
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load page data");
      setLoading(false);
    }
  }

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
        } catch (err) {
          // Analysis might still be processing
          console.log("Analysis still processing...");
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

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return (
        <Badge variant="default" className="bg-green-500">
          High ({score}%)
        </Badge>
      );
    if (score >= 60)
      return (
        <Badge variant="secondary" className="bg-yellow-500">
          Medium ({score}%)
        </Badge>
      );
    return <Badge variant="destructive">Low ({score}%)</Badge>;
  };

  const openEditor = (
    contentType: "title" | "description" | "faq" | "paragraph" | "keywords",
    currentContent: string,
    title: string,
    description: string
  ) => {
    setEditorModal({
      isOpen: true,
      contentType,
      currentContent,
      title,
      description,
    });
  };

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
    } catch (error: any) {
      setToast({
        message:
          error.message ||
          `Failed to save${
            deployImmediately ? " and deploy" : ""
          } ${contentType}`,
        type: "error",
      });
    }
  };

  const removeParagraph = (index: number) => {
    setContentData((prev) => ({
      ...prev,
      paragraphs: prev.paragraphs.filter((_, i) => i !== index),
    }));
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
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to undeploy content",
        type: "error",
      });
    } finally {
      setUndeploying(false);
      setUndeployDialog({ open: false, contentType: null });
    }
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
  let analysisJson = null;
  if (analysis?.summary && typeof analysis.summary === "string") {
    try {
      analysisJson = JSON.parse(analysis.summary);
    } catch (e) {
      console.error(
        "Failed to parse analysis.summary as JSON:",
        analysis.summary,
        e
      );
      analysisJson = null;
    }
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
                        <h1 className="text-2xl font-bold">
                          Page Content Editor
                        </h1>
                        <p className="text-muted-foreground">
                          AI-powered content optimization and editing
                        </p>
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
                          <label className="text-sm font-medium text-muted-foreground">
                            URL
                          </label>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="break-all">
                              {pageData.url}
                            </p>
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
                          <div className="mt-1">
                            {pageData.llmReadinessScore &&
                            pageData.llmReadinessScore > 0 ? (
                              getScoreBadge(
                                Math.round(pageData.llmReadinessScore)
                              )
                            ) : (
                              <Badge variant="outline">Not analyzed</Badge>
                            )}
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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openEditor(
                                    "title",
                                    contentData.title || pageData.title || "",
                                    "Edit Page Title",
                                    "Generate optimized title suggestions for better SEO and click-through rates"
                                  )
                                }
                                disabled={!analysis}
                                className={
                                  !analysis
                                    ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              {deployedTitle ? (
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
                                  className="text-red-600 border-red-300 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Undeploy
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setUndeployDialog({
                                      open: true,
                                      contentType: "title",
                                    })
                                  }
                                  disabled={true}
                                  className="text-red-600 border-red-300 hover:text-red-800 cursor-not-allowed opacity-50"
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

                      {/* Description Editor */}
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
                                      pageData.description ||
                                      "",
                                    "Edit Meta Description",
                                    "Generate compelling meta descriptions that improve search result click-through rates"
                                  )
                                }
                                disabled={!analysis}
                                className={
                                  !analysis
                                    ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              {deployedDescription ? (
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
                                  className="text-red-600 border-red-300 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Undeploy
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setUndeployDialog({
                                      open: true,
                                      contentType: "description",
                                    })
                                  }
                                  disabled={true}
                                  className="text-red-600 border-red-300 hover:text-red-800 cursor-not-allowed opacity-50"
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
                                  deployedDescription.optimizedContent.length >=
                                    150 &&
                                  deployedDescription.optimizedContent.length <=
                                    160
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {deployedDescription
                                  ? deployedDescription.optimizedContent.length
                                  : originalMetaDescription?.length || 0}{" "}
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

                      {/* FAQ Section */}
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
                                    ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add FAQ
                              </Button>
                              {contentData.faqs.length > 0 && (
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
                                  className="text-red-600 border-red-300 hover:text-red-800"
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
                                No FAQs added yet - click "Add FAQ" to generate
                                suggestions
                              </p>
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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openEditor(
                                    "paragraph",
                                    "",
                                    "Add Content Paragraph",
                                    "Generate optimized content paragraphs to improve page depth and keyword coverage"
                                  )
                                }
                                disabled={!analysis}
                                className={
                                  !analysis
                                    ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
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
                          {contentData.paragraphs.length > 0 ? (
                            <div className="space-y-4">
                              {contentData.paragraphs.map((para, index) => (
                                <div
                                  key={index}
                                  className="p-4 bg-muted rounded-lg flex items-center gap-2"
                                >
                                  <div className="flex-1">
                                    <p className="whitespace-pre-line">
                                      {para}
                                    </p>
                                  </div>
                                  <Badge variant="default">Deployed</Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeParagraph(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <PenTool className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                              <p>
                                No paragraphs added yet - click "Add Paragraph"
                                to generate suggestions
                              </p>
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
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Analyze
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
                                {contentData.keywords.longTail.length > 0 ? (
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
                                {contentData.keywords.semantic.length > 0 ? (
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

                      {/* Analysis Results */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>Analysis Results</span>
                          </CardTitle>
                          <CardDescription>
                            Latest AI-powered analysis and optimization
                            recommendations
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
                                <div className="bg-muted rounded-lg p-4">
                                  <p className="text-foreground">
                                    {analysisJson?.summary}
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              {/* Issues */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                  <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                                  Issues Found
                                </h3>
                                {analysis.issues.length > 0 ? (
                                  <ul className="space-y-2">
                                    {analysis.issues.map((issue, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start space-x-3"
                                      >
                                        <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-foreground">
                                          {issue}
                                        </span>
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
                                  <Target className="h-5 w-5 mr-2 text-primary" />
                                  Recommendations
                                </h3>
                                {analysis.recommendations.length > 0 ? (
                                  <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start space-x-3"
                                      >
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-foreground">
                                          {rec}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-muted-foreground">
                                    No specific recommendations at this time.
                                  </p>
                                )}
                              </div>

                              {/* Analysis Metadata */}
                              <div className="pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Analysis generated:{" "}
                                  {new Date(
                                    analysis.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
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
