"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getSites } from "@/lib/api";
import { AddSiteModal } from "@/components/add-site-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Globe, BarChart3, Clock, Zap, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import Toast from "@/components/Toast";

interface Site {
  id: string;
  name: string;
  url: string;
  status: string;
  lastScan?: string;
  llmReadiness?: number;
  pagesScanned?: number;
  totalPages?: number;
  improvements?: number;
}

interface DashboardClientProps {
  initialSites?: Site[];
}

export function DashboardClient({ initialSites = [] }: DashboardClientProps) {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

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
      
      const data = await getSites(token);
      
      // Add mock metrics for demo purposes
      const sitesWithMetrics = data.map((site: Site) => ({
        ...site,
        lastScan: "2 hours ago",
        llmReadiness: Math.floor(Math.random() * 40) + 60, // 60-100%
        pagesScanned: Math.floor(Math.random() * 50) + 10,
        totalPages: Math.floor(Math.random() * 100) + 50,
        improvements: Math.floor(Math.random() * 10) + 5
      }));
      
      setSites(sitesWithMetrics);
    } catch (err: unknown) {
      console.error("Failed to fetch sites:", err);
      setError(err instanceof Error ? err.message : "Failed to load sites");
    } finally {
      setLoading(false);
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
  }, [isLoaded, isSignedIn, router, initialSites.length]);

  const handleSiteAdded = () => {
    fetchSites(); // Refresh the sites list
  };

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
  const totalActiveScans = sites.filter(site => site.status === 'scanning').length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.emailAddresses[0]?.emailAddress?.split('@')[0]}! 
            Here's an overview of your SEO optimization progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sites</p>
                  <p className="text-3xl font-bold text-gray-900">{totalSites}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {totalSites > 0 ? `+${totalSites} this month` : "Get started by adding your first site"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. LLM Readiness</p>
                  <p className="text-3xl font-bold text-gray-900">{avgLLMReadiness}%</p>
                  <p className="text-sm text-green-600 mt-1">
                    {avgLLMReadiness >= 75 ? "Great performance!" : "Room for improvement"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Scans</p>
                  <p className="text-3xl font-bold text-gray-900">{totalActiveScans}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {totalActiveScans > 0 ? "Scans in progress..." : "All scans complete"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Websites</CardTitle>
                <CardDescription>
                  Monitor and manage your websites' LLM optimization progress
                </CardDescription>
              </div>
              <AddSiteModal 
                onSiteAdded={handleSiteAdded}
                onError={handleError}
                onSuccess={handleSuccess}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">Loading sites...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load sites</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={handleTryAgain}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sites yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first website to optimize for LLMs.</p>
                <AddSiteModal 
                  onSiteAdded={handleSiteAdded}
                  onError={handleError}
                  onSuccess={handleSuccess}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sites.map(site => (
                  <Card key={site.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{site.name}</h3>
                            <p className="text-sm text-gray-600">{site.url}</p>
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
                          <span className="text-sm font-medium text-gray-700">LLM Readiness</span>
                          <span className="text-sm font-bold text-gray-900">{site.llmReadiness}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getReadinessColor(site.llmReadiness || 0)}`}
                            style={{ width: `${site.llmReadiness || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pages Scanned</p>
                          <p className="font-semibold">{site.pagesScanned}/{site.totalPages}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Improvements</p>
                          <p className="font-semibold text-green-600">+{site.improvements}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Last scan: {site.lastScan}
                        </div>
                        <Button 
                          variant="outline" 
                          className="text-xs h-8 px-3"
                          onClick={() => router.push(`/dashboard/${site.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 