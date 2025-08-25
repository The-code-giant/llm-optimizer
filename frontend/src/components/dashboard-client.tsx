"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getSitesWithMetrics, SiteWithMetrics, addSite } from "@/lib/api";
import { AddSiteModal } from "@/components/add-site-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Globe, BarChart3, Clock, Zap, AlertCircle, CheckCircle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import Toast from "@/components/Toast";
import { StatCard } from '@/components/ui/stat-card'

interface DashboardClientProps {
  initialSites?: SiteWithMetrics[];
}

export function DashboardClient({ initialSites = [] }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [sites, setSites] = useState<SiteWithMetrics[]>(initialSites);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isCreatingSite, setIsCreatingSite] = useState(false);

  const fetchSites = async () => {
    if (!isSignedIn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        return;
      }
      
      const sitesWithMetrics = await getSitesWithMetrics(token);
      setSites(sitesWithMetrics);
    } catch (err: unknown) {
      console.error("Failed to fetch sites:", err);
      setError(err instanceof Error ? err.message : "Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  // Handle website URL from signup flow
  const handleWebsiteUrl = async () => {
    const websiteUrl = searchParams.get('website');
    if (!websiteUrl || !isSignedIn) return;

    setIsCreatingSite(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      // Extract domain name for site name
      const domain = new URL(websiteUrl).hostname;
      const siteName = domain.replace(/^www\./, '');

      // Create the site
      const newSite = await addSite(token, siteName, websiteUrl);
      
      // Show success message
      setToast({ 
        message: `Successfully added ${siteName} to your dashboard!`, 
        type: "success" 
      });

      // Refresh sites list
      await fetchSites();

      // Remove the website parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('website');
      router.replace(newUrl.pathname + newUrl.search);

      // Redirect to the new site page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/${newSite.id}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to create site:', err);
      setToast({ 
        message: 'Failed to add website. Please try adding it manually.', 
        type: "error" 
      });
    } finally {
      setIsCreatingSite(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    if (initialSites.length === 0) {
      fetchSites();
    }

    // Handle website URL if present
    if (searchParams.get('website')) {
      handleWebsiteUrl();
    }
  }, [isLoaded, isSignedIn, router, initialSites.length, searchParams]);

  const handleSiteAdded = async (siteId?: string) => {
    await fetchSites(); // Refresh the sites list
    
    // If a siteId is provided, redirect to that site page
    if (siteId) {
      // Show success message first
      setToast({ 
        message: "Site added successfully! Redirecting to site page...", 
        type: "success" 
      });
      
      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push(`/dashboard/${siteId}`);
      }, 1500);
    }
  };

  // Keep this available for other flows; AddSiteModal will not call it on failure now
  const handleError = (message: string) => {
    setError(message);
    setToast({ message, type: "error" });
  };

  const handleSuccess = (message: string) => {
    setToast({ message, type: "success" });
  };

  const handleTryAgain = () => {
    fetchSites(); // Don't redirect, just retry fetching
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'scanning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'scanning':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate totals for stats
  const totalSites = sites.length;
  const avgLLMReadiness = sites.length > 0 
    ? Math.round(sites.reduce((sum, site) => sum + (site.llmReadiness || 0), 0) / sites.length)
    : 0;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          durationMs={toast.type === 'error' ? 10000 : 4000}
        />
      )}
      
      <div className="space-y-6">
        {/* Header */}
        <div data-tour="welcome">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.fullName ? user.fullName : user?.emailAddresses[0]?.emailAddress?.split('@')[0]}! 
            Here&apos;s an overview of your SEO optimization progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-tour="stats-overview">
          <StatCard
            icon={Globe}
            title="Total Sites"
            value={totalSites}
            badge={totalSites > 0 ? `+${totalSites} this month` : undefined}
            trend={totalSites > 0 ? "Trending up" : undefined}
            trendIcon={TrendingUp}
            trendColor={totalSites > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}
            description="Number of sites tracked"
          />
          <StatCard
            icon={BarChart3}
            title="Avg. LLM Readiness"
            value={`${avgLLMReadiness}%`}
            badge={avgLLMReadiness >= 75 ? "Great performance!" : "Room for improvement"}
            trend={avgLLMReadiness >= 75 ? "Improving" : "Needs work"}
            trendIcon={avgLLMReadiness >= 75 ? TrendingUp : TrendingDown}
            trendColor={avgLLMReadiness >= 75 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}
            description="Average readiness score across all sites"
          />
          <StatCard
            icon={Zap}
            title="Recommendations"
            value="Coming Soon"
            badge="New feature"
            trend="In development"
            trendIcon={TrendingUp}
            trendColor="text-blue-600 dark:text-blue-400"
            description="AI-powered optimization suggestions"
          />
        </div>

        {/* Sites Section */}
        <Card data-tour="sites-section">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Websites</CardTitle>
                <CardDescription>
                  Monitor and manage your websites&apos; LLM optimization progress
                </CardDescription>
              </div>
              <div data-tour="add-site">
                <AddSiteModal 
                  onSiteAdded={handleSiteAdded}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isCreatingSite ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Adding your website...</span>
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading sites...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Failed to load sites</h3>
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={handleTryAgain}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No sites yet</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first website to optimize for LLMs.</p>
                <div data-tour="add-site">
                  <AddSiteModal 
                    onSiteAdded={handleSiteAdded}
                    onSuccess={handleSuccess}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sites.map(site => (
                  <Link href={`/dashboard/${site.id}`} key={site.id}>
                  <Card key={site.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">{site.name}</h3>
                            <p className="text-sm text-muted-foreground">{site.url}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(site.status)} className="flex items-center gap-1">
                          {getStatusIcon(site.status)}
                          {site.status}
                        </Badge>
                      </div>

                      {/* LLM Readiness Score */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">LLM Readiness</span>
                          <span className="text-sm font-bold">{site.llmReadiness}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getReadinessColor(site.llmReadiness || 0)}`}
                            style={{ width: `${site.llmReadiness || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Pages Scanned</p>
                          <p className="font-semibold">{site.pagesScanned}/{site.totalPages}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Improvements</p>
                          <p className="font-semibold text-green-600">+{site.improvements}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          Last scan: {site.lastScan}
                        </div>
                        <Button 
                          variant="outline" 
                          className="text-xs h-8 px-3 cursor-pointer"
                          onClick={() => router.push(`/dashboard/${site.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 