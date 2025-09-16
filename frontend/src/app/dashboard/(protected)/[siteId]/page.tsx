"use client";
import { AppSidebar } from "@/components/app-sidebar";
import PageContentDeploymentModal from "@/components/content-deployment-modal";
import { SiteHeader } from "@/components/site-header";
import { DeleteConfirmationDialog, DeletePageDialog, SiteAnalyticsTab, SiteDashboardOverview, SitePagesManagement, SiteSettingsDialog } from "@/components/site-page";
import Toast from "@/components/Toast";
import { TourTrigger } from "@/components/tours";
import TrackerScriptModal from "@/components/tracker-script-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deletePage,
  deletePages,
  deleteSite,
  getPages,
  getSiteDetails,
  Page,
  SiteDetails,
} from "@/lib/api";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Globe,
  RefreshCw,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SiteDetailsPage() {
  const router = useRouter();
  const { siteId } = useParams() as { siteId: string };
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [site, setSite] = useState<SiteDetails | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<
    "title" | "url" | "score" | "lastScanned" | "createdAt"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [scoreFilter, setScoreFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Tracker modals state
  const [showTrackerScript, setShowTrackerScript] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeletePageDialog, setShowDeletePageDialog] = useState(false);
  const [pendingDeletePage, setPendingDeletePage] = useState<Page | null>(null);
  const [selectedPageForDeployment, setSelectedPageForDeployment] =
    useState<Page | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">(
    "overview"
  );
  const [pagesRefreshToken, setPagesRefreshToken] = useState(0);

  // Add Single Page and Import Sitemap handled by extracted components

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !siteId) {
      router.replace("/login");
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token || !siteId) {
          setError("Failed to get authentication token");
          return;
        }
        const [siteData, pagesData] = await Promise.all([
          getSiteDetails(token, siteId),
          getPages(token, siteId),
        ]);
        setSite(siteData);
        setPages(pagesData.pages);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load site details"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isLoaded, isSignedIn, getToken, siteId, router]);


  const refreshData = async () => {
    if (!siteId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const [siteData, pagesData] = await Promise.all([
        getSiteDetails(token, siteId),
        getPages(token, siteId),
      ]);
      setSite(siteData);
      setPages(pagesData.pages);
      setToast({ message: "Data refreshed successfully", type: "success" });
    } catch {
      setToast({ message: "Failed to refresh data", type: "error" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) return;

    const pageCount = selectedPages.size;
    const pageNames = Array.from(selectedPages)
      .map((pageId) => {
        const page = pages.find((p) => p.id === pageId);
        return page?.title || page?.url || "Unknown page";
      })
      .slice(0, 3); // Show first 3 page names

    const confirmMessage =
      pageCount === 1
        ? `Delete "${pageNames[0]}"?\n\nThis will permanently delete the page and all its related data (analysis results, content, suggestions, etc.).`
        : `Delete ${pageCount} selected pages?\n\nPages: ${pageNames.join(
            ", "
          )}${
            pageCount > 3 ? "..." : ""
          }\n\nThis will permanently delete all pages and their related data (analysis results, content, suggestions, etc.).`;

    if (!confirm(confirmMessage)) return;

    try {
      setToast({
        message: `Deleting ${pageCount} page${pageCount > 1 ? "s" : ""}...`,
        type: "info",
      });

      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        return;
      }

      // Delete pages
      const pageIds = Array.from(selectedPages);
      await deletePages(token, pageIds);

      // Clear selection
      setSelectedPages(new Set());

      // Refresh the pages list
      const updatedPages = await getPages(token, siteId);
      setPages(updatedPages.pages);

      setToast({
        message: `Successfully deleted ${pageCount} page${
          pageCount > 1 ? "s" : ""
        }`,
        type: "success",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete pages";
      setToast({ message: errorMessage, type: "error" });
      console.error("Delete error:", err);
    }
  };

  const handleDeleteSite = async () => {
    try {
      // Close modals immediately when delete is clicked
      setShowSettings(false);
      setShowDeleteConfirmation(false);
      
      setToast({
        message: "Deleting site...",
        type: "info",
      });
      
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        setToast({
          message: "Failed to get authentication token",
          type: "error",
        });
        return;
      }
      
      await deleteSite(token, siteId);
      
      // Navigate to dashboard after successful deletion
      router.push("/dashboard");
      setToast({
        message: "Site deleted successfully",
        type: "success",
      });
    } catch (err: unknown) {
      console.error("Error deleting site:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to delete site";
      setError(errorMessage);
      setToast({
        message: errorMessage,
        type: "error",
      });
    }
  };

  // Calculate metrics using new scoring system
  const pagesWithScores = pages.filter(page => 
    page.pageScore != null && page.pageScore > 0 ||
    (page.sectionRatings && Object.values(page.sectionRatings).some(score => score > 0)) || 
    (page.llmReadinessScore != null && page.llmReadinessScore > 0)
  );
  
  // Utility function to calculate overall score from section ratings
  const calculateOverallScore = (page: Page): number => {
    // Use cached pageScore if available (most accurate)
    if (page.pageScore != null) {
      return page.pageScore;
    }
    
    // Fallback to calculating from section ratings
    if (page.sectionRatings) {
      const scores = Object.values(page.sectionRatings) as number[];
      const total = scores.reduce((sum: number, score: number) => sum + score, 0);
      const maxPossible = scores.length * 10; // 7 sections * 10 = 70
      return Math.round((total / maxPossible) * 100); // Convert to percentage
    }
    
    // Final fallback to legacy score
    return page.llmReadinessScore || 0;
  };
  
  const averageLLMScore =
    pagesWithScores.length > 0
      ? Math.round(
          pagesWithScores.reduce((sum, page) => sum + calculateOverallScore(page), 0) /
            pagesWithScores.length
        )
      : 0;
  const pagesAbove75 = pages.filter(
    (page) => calculateOverallScore(page) >= 75
  ).length;
  const recentlyScanned = pages.filter((page) => {
    const lastScan = new Date(page.lastScannedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastScan > weekAgo;
  }).length;

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {toast && (
                  <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                  />
                )}

                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0" data-tour="site-header">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard")}
                        className="p-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold truncate">
                          {loading
                            ? "Loading..."
                            : site?.name || "Site Details"}
                        </h1>
                        {site && (
                          <p className="text-muted-foreground mt-1 flex items-center text-sm">
                            <Globe className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{site.url}</span>
                            <a
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-primary hover:text-primary/80 flex-shrink-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Tab Navigation */}
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "analytics")} className="w-auto">
                      <TabsList className="grid w-auto grid-cols-2">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-black data-[state=active]:text-white">Overview</TabsTrigger>
                        <TabsTrigger value="analytics" className="data-[state=active]:bg-black data-[state=active]:text-white">Analytics</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Dashboard Overview */}
                  {site && activeTab === "overview" && (
                    <SiteDashboardOverview
                      site={site}
                      pages={pages}
                      recentlyScanned={recentlyScanned}
                      siteId={siteId}
                      averageLLMScore={averageLLMScore}
                      pagesAbove75={pagesAbove75}
                      onShowTrackerScript={() => setShowTrackerScript(true)}
                      onSetActiveTab={setActiveTab}
                      onPagesUpdated={setPages}
                      onToast={setToast}
                      onShowSettings={() => setShowSettings(true)}
                    />
                  )}

                  {error && (
                    <Card className="border-destructive bg-destructive/10">
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                          <p className="text-destructive">{error}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="pt-6">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-muted rounded w-1/2"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    site && (
                      <>
                        {/* Tab Content */}
                        {activeTab === "overview" && (
                          <>
                            {/* Pages Management */}
                            <SitePagesManagement
                              site={site}
                              siteId={siteId}
                              refreshToken={pagesRefreshToken}
                              searchTerm={searchTerm}
                              setSearchTerm={setSearchTerm}
                              sortBy={sortBy}
                              setSortBy={setSortBy}
                              sortOrder={sortOrder}
                              setSortOrder={setSortOrder}
                              scoreFilter={scoreFilter}
                              setScoreFilter={setScoreFilter}
                              selectedPages={selectedPages}
                              setSelectedPages={setSelectedPages}
                              showAddPageModal={showAddPageModal}
                              setShowAddPageModal={setShowAddPageModal}
                              onRefresh={refreshData}
                              onDeletePage={async (pageId: string) => {
                                const page = pages.find((p) => p.id === pageId) || null;
                                setPendingDeletePage(page);
                                setShowDeletePageDialog(true);
                              }}
                              onBulkDelete={handleBulkDelete}
                              calculateOverallScore={calculateOverallScore}
                              getToken={getToken}
                            />
                          </>
                        )}

                        {/* Analytics Tab Content */}
                        {activeTab === "analytics" && site && (
                          <SiteAnalyticsTab
                            site={site}
                            siteId={siteId}
                          />
                        )}
                      </>
                    )
                  )}
                </div>

                {/* Tracker Modals */}
                {site && (
                  <>
                    <TrackerScriptModal
                      isOpen={showTrackerScript}
                      onClose={() => setShowTrackerScript(false)}
                      siteId={siteId}
                      siteName={site.name}
                    />

                    {selectedPageForDeployment && (
                      <PageContentDeploymentModal
                        isOpen={!!selectedPageForDeployment}
                        onClose={() => setSelectedPageForDeployment(null)}
                        pageId={selectedPageForDeployment.id}
                        pageUrl={selectedPageForDeployment.url}
                        pageTitle={
                          selectedPageForDeployment.title || "Untitled Page"
                        }
                      />
                    )}

                    {/* Settings Modal */}
                    <SiteSettingsDialog
                      isOpen={showSettings}
                      onClose={() => setShowSettings(false)}
                      site={site}
                      onShowDeleteConfirmation={() => setShowDeleteConfirmation(true)}
                    />

                    {/* Delete Site Confirmation Dialog */}
                    <DeleteConfirmationDialog
                      isOpen={showDeleteConfirmation}
                      onClose={() => setShowDeleteConfirmation(false)}
                      siteName={site.name}
                      onConfirm={handleDeleteSite}
                    />

                    {/* Delete Page Confirmation Dialog */}
                    <DeletePageDialog
                      isOpen={showDeletePageDialog}
                      onClose={() => setShowDeletePageDialog(false)}
                      pageLabel={pendingDeletePage?.title || pendingDeletePage?.url || "this page"}
                      onConfirm={async () => {
                        try {
                          setToast({ message: "Deleting page...", type: "info" });
                          const token = await getToken();
                          if (!token || !pendingDeletePage) {
                            setError("Failed to get authentication token");
                            return;
                          }
                          await deletePage(token, pendingDeletePage.id);
                          const updatedPagesResponse = await getPages(token, siteId);
                          setPages(updatedPagesResponse.pages);
                          setPagesRefreshToken((v) => v + 1);
                          setToast({ message: "Page deleted successfully", type: "success" });
                        } catch (err: unknown) {
                          const errorMessage = err instanceof Error ? err.message : "Failed to delete page";
                          setToast({ message: errorMessage, type: "error" });
                        } finally {
                          setShowDeletePageDialog(false);
                          setPendingDeletePage(null);
                        }
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Tab-specific Tour Triggers - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50">
        {activeTab === "overview" && (
          <TourTrigger 
            tourId="site-details" 
            className="shadow-xl bg-background/95 backdrop-blur-sm border-primary/30 hover:bg-background hover:border-primary/50 hover:shadow-2xl transition-all duration-200"
          >
            Start Overview Tour
          </TourTrigger>
        )}
        {activeTab === "analytics" && (
          <TourTrigger 
            tourId="analytics" 
            className="shadow-xl bg-background/95 backdrop-blur-sm border-primary/30 hover:bg-background hover:border-primary/50 hover:shadow-2xl transition-all duration-200"
          >
            Start Analytics Tour
          </TourTrigger>
        )}
      </div>
    </SidebarProvider>
  );
}
