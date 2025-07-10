"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { 
  getSiteDetails, 
  getPages, 
  Page, 
  SiteDetails, 
  importSitemap,
  addPage,
  deletePage,
  deletePages
} from "../../../lib/api";
import { DashboardLayout } from "../../../components/ui/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { 
  Globe, 
  BarChart3, 
  FileText, 
  Calendar, 
  TrendingUp, 
  ExternalLink,
  Download,
  RefreshCw,
  Search,
  ArrowLeft,
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  Play,
  Trash2,
  Settings,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  ListPlus
} from "lucide-react";
import Link from "next/link";
import Toast from "../../../components/Toast";
import TrackerScriptModal from "../../../components/tracker-script-modal";
import PageContentDeploymentModal from "../../../components/content-deployment-modal";
import TrackerAnalytics from "../../../components/tracker-analytics";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";

interface ImportProgress {
  status: 'idle' | 'importing' | 'processing' | 'completed' | 'error';
  total?: number;
  processed?: number;
  message?: string;
}

export default function SiteDetailsPage() {
  const router = useRouter();
  const { siteId } = useParams() as { siteId: string };
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [site, setSite] = useState<SiteDetails | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'title' | 'url' | 'score' | 'lastScanned'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [importProgress, setImportProgress] = useState<ImportProgress>({ status: 'idle' });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Tracker modals state
  const [showTrackerScript, setShowTrackerScript] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPageManagement, setShowPageManagement] = useState(false);
  const [selectedPageForDeployment, setSelectedPageForDeployment] = useState<Page | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

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
        setPages(pagesData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load site details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isLoaded, isSignedIn, getToken, siteId, router]);

  async function handleImportSitemap(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setError(null);
    setImportProgress({ status: 'importing', message: 'Fetching sitemap...' });
    
    try {
      const token = await getToken();
      if (!token || !siteId) {
        setError("Failed to get authentication token");
        return;
      }

      // Validate sitemap URL
      if (!sitemapUrl.includes('sitemap')) {
        throw new Error("URL doesn't appear to be a valid sitemap");
      }

      setImportProgress({ status: 'processing', message: 'Processing sitemap entries...' });
      
      await importSitemap(token, siteId, sitemapUrl);
      
      setImportProgress({ 
        status: 'completed', 
        message: 'Sitemap imported successfully!' 
      });
      
      setToast({ message: "Sitemap import completed! Refreshing pages...", type: "success" });
      setSitemapUrl("");
      
      // Refresh pages after import
      setTimeout(async () => {
        const pagesData = await getPages(token, siteId);
        setPages(pagesData);
        setImportProgress({ status: 'idle' });
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import sitemap";
      setError(errorMessage);
      setImportProgress({ 
        status: 'error', 
        message: errorMessage 
      });
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setImporting(false);
    }
  }

  async function handleAddManualPage(e: React.FormEvent) {
    e.preventDefault();
    setAddingPage(true);
    try {
      const token = await getToken();
      if (!token || !siteId) {
        setError("Failed to get authentication token");
        return;
      }
      
      // Call the real API to add the page
      const newPage = await addPage(token, siteId, manualUrl);
      setToast({ message: "Page added successfully!", type: "success" });
      setManualUrl("");
      
      // Refresh pages
      const pagesData = await getPages(token, siteId);
      setPages(pagesData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add page";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setAddingPage(false);
    }
  }

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
      setPages(pagesData);
      setToast({ message: "Data refreshed successfully", type: "success" });
    } catch (err: unknown) {
      setToast({ message: "Failed to refresh data", type: "error" });
    }
  };

  const handleSelectPage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPages.size === filteredAndSortedPages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(filteredAndSortedPages.map(page => page.id)));
    }
  };

  const handleBulkAnalyze = async () => {
    if (selectedPages.size === 0) return;
    setToast({ 
      message: `Starting analysis for ${selectedPages.size} pages...`, 
      type: "info" 
    });
    // Here you would implement bulk analysis API call
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) return;
    
    const pageCount = selectedPages.size;
    const pageNames = Array.from(selectedPages)
      .map(pageId => {
        const page = pages.find(p => p.id === pageId);
        return page?.title || page?.url || 'Unknown page';
      })
      .slice(0, 3); // Show first 3 page names
    
    const confirmMessage = pageCount === 1 
      ? `Delete "${pageNames[0]}"?\n\nThis will permanently delete the page and all its related data (analysis results, content, suggestions, etc.).`
      : `Delete ${pageCount} selected pages?\n\nPages: ${pageNames.join(', ')}${pageCount > 3 ? '...' : ''}\n\nThis will permanently delete all pages and their related data (analysis results, content, suggestions, etc.).`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setToast({ 
        message: `Deleting ${pageCount} page${pageCount > 1 ? 's' : ''}...`, 
        type: "info" 
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
      setPages(updatedPages);

      setToast({ 
        message: `Successfully deleted ${pageCount} page${pageCount > 1 ? 's' : ''}`, 
        type: "success" 
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete pages";
      setToast({ message: errorMessage, type: "error" });
      console.error('Delete error:', err);
    }
  };

  // Calculate metrics
  const totalPages = pages.length;
  const averageLLMScore = totalPages > 0 
    ? Math.round(pages.reduce((sum, page) => sum + page.llmReadinessScore, 0) / totalPages)
    : 0;
  const pagesAbove80 = pages.filter(page => page.llmReadinessScore >= 80).length;
  const recentlyScanned = pages.filter(page => {
    const lastScan = new Date(page.lastScannedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastScan > weekAgo;
  }).length;

  // Filter and sort pages
  const filteredAndSortedPages = pages
    .filter(page => {
      const matchesSearch = page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.url.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesScore = scoreFilter === 'all' || 
        (scoreFilter === 'high' && page.llmReadinessScore >= 80) ||
        (scoreFilter === 'medium' && page.llmReadinessScore >= 60 && page.llmReadinessScore < 80) ||
        (scoreFilter === 'low' && page.llmReadinessScore < 60);
      
      return matchesSearch && matchesScore;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title || a.url;
          bValue = b.title || b.url;
          break;
        case 'url':
          aValue = a.url;
          bValue = b.url;
          break;
        case 'score':
          aValue = a.llmReadinessScore;
          bValue = b.llmReadinessScore;
          break;
        case 'lastScanned':
          aValue = new Date(a.lastScannedAt).getTime();
          bValue = new Date(b.lastScannedAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">Loading...</p>
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
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {loading ? "Loading..." : site?.name || "Site Details"}
              </h1>
              {site && (
                <p className="text-gray-600 mt-1 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  {site.url}
                  <a 
                    href={site.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Tab Navigation */}
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button
                variant={activeTab === 'overview' ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </Button>
              <Button
                variant={activeTab === 'analytics' ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </Button>
            </div>
            
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Top Action Buttons */}
        {site && activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your site's tracker and content deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={() => setShowTrackerScript(true)}
                  className="flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Get Script
                </Button>
                <Dialog open={showPageManagement} onOpenChange={setShowPageManagement}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="flex items-center"
                    >
                      <ListPlus className="h-4 w-4 mr-2" />
                      Manage Pages
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Pages</DialogTitle>
                      <DialogDescription>
                        Add pages to your site by importing from sitemap or adding individual URLs
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-6 md:grid-cols-2 mt-6">
                      {/* Sitemap Import */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Upload className="h-5 w-5 mr-2" />
                            Import Sitemap
                          </CardTitle>
                          <CardDescription>
                            Bulk import pages from your website's sitemap
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <form onSubmit={handleImportSitemap} className="space-y-4">
                            <Input
                              type="url"
                              placeholder="https://yoursite.com/sitemap.xml"
                              value={sitemapUrl}
                              onChange={(e) => setSitemapUrl(e.target.value)}
                              required
                              disabled={importing}
                            />
                            
                            {importProgress.status !== 'idle' && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  {importProgress.status === 'importing' && (
                                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                                  )}
                                  {importProgress.status === 'processing' && (
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                  )}
                                  {importProgress.status === 'completed' && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                  {importProgress.status === 'error' && (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="text-sm">{importProgress.message}</span>
                                </div>
                              </div>
                            )}
                            
                            <Button type="submit" disabled={importing} className="w-full">
                              {importing ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Import Sitemap
                                </>
                              )}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>

                      {/* Manual Page Addition */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Plus className="h-5 w-5 mr-2" />
                            Add Single Page
                          </CardTitle>
                          <CardDescription>
                            Manually add a specific page for analysis
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleAddManualPage} className="space-y-4">
                            <Input
                              type="url"
                              placeholder="https://yoursite.com/specific-page"
                              value={manualUrl}
                              onChange={(e) => setManualUrl(e.target.value)}
                              required
                              disabled={addingPage}
                            />
                            <Button type="submit" disabled={addingPage} className="w-full">
                              {addingPage ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Page
                                </>
                              )}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : site && (
          <>
            {/* Tab Content */}
            {activeTab === 'overview' && (
          <>
            {/* Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPages}</div>
                  <p className="text-xs text-muted-foreground">
                    Pages tracked for optimization
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg LLM Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageLLMScore}%</div>
                  <p className="text-xs text-muted-foreground">
                    Average readiness score
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Quality</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pagesAbove80}</div>
                  <p className="text-xs text-muted-foreground">
                    Pages with 80%+ score
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Scans</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentlyScanned}</div>
                  <p className="text-xs text-muted-foreground">
                    Scanned this week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Site Information */}
            <Card>
              <CardHeader>
                <CardTitle>Site Information</CardTitle>
                <CardDescription>
                  Basic details and configuration for your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tracker ID</label>
                    <p className="font-mono text-sm bg-gray-50 p-2 rounded border">
                      {site.trackerId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                        {site.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-sm text-gray-900">
                      {new Date(site.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Pages Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pages ({filteredAndSortedPages.length})</CardTitle>
                    <CardDescription>
                      Monitor and analyze your website pages
                    </CardDescription>
                  </div>
                  
                  {/* Bulk Actions */}
                  {selectedPages.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedPages.size} selected
                      </span>
                      <Button variant="outline" size="sm" onClick={handleBulkAnalyze}>
                        <Play className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Filters and Search */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search pages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value as any)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="high">High (80%+)</option>
                    <option value="medium">Medium (60-79%)</option>
                    <option value="low">Low (&lt;60%)</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="title">Sort by Title</option>
                    <option value="url">Sort by URL</option>
                    <option value="score">Sort by Score</option>
                    <option value="lastScanned">Sort by Last Scan</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {filteredAndSortedPages.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm || scoreFilter !== 'all' 
                        ? "No pages match your filters." 
                        : "No pages found. Import your sitemap to get started."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Select All */}
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="p-1"
                      >
                        {selectedPages.size === filteredAndSortedPages.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="text-sm text-gray-600">Select All</span>
                    </div>
                    
                    {filteredAndSortedPages.map((page) => (
                      <div key={page.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectPage(page.id)}
                              className="p-1 mt-1"
                            >
                              {selectedPages.has(page.id) ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {page.title || "Untitled Page"}
                                </h3>
                                <Badge 
                                  variant={page.llmReadinessScore >= 80 ? "default" : 
                                          page.llmReadinessScore >= 60 ? "secondary" : "destructive"}
                                >
                                  {page.llmReadinessScore}% LLM Ready
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 truncate mb-2">{page.url}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Last scanned: {new Date(page.lastScannedAt).toLocaleDateString()}</span>
                                {page.lastAnalysisAt && (
                                  <span>Last analyzed: {new Date(page.lastAnalysisAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPageForDeployment(page)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Deploy Content
                            </Button>
                            <Link href={`/dashboard/${siteId}/pages/${page.id}`}>
                              <Button variant="outline" size="sm">
                                View Analysis
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const confirmMessage = `Delete "${page.title || page.url}"?\n\nThis will permanently delete the page and all its related data (analysis results, content, suggestions, etc.).`;
                                if (confirm(confirmMessage)) {
                                  try {
                                    setToast({ message: "Deleting page...", type: "info" });
                                    const token = await getToken();
                                    if (!token) {
                                      setError("Failed to get authentication token");
                                      return;
                                    }
                                    await deletePage(token, page.id);
                                    
                                    // Refresh the pages list
                                    const updatedPages = await getPages(token, siteId);
                                    setPages(updatedPages);
                                    
                                    setToast({ message: "Page deleted successfully", type: "success" });
                                  } catch (err: unknown) {
                                    const errorMessage = err instanceof Error ? err.message : "Failed to delete page";
                                    setToast({ message: errorMessage, type: "error" });
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800 border-red-300 hover:border-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
            
            {/* Analytics Tab Content */}
            {activeTab === 'analytics' && site && (
              <TrackerAnalytics 
                siteId={siteId} 
                siteName={site.name} 
              />
            )}
          </>
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
              pageTitle={selectedPageForDeployment.title || "Untitled Page"}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
} 