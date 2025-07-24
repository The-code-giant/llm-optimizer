"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { DashboardLayout } from "../../../components/ui/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { BarChart3, TrendingUp, Activity, Zap } from "lucide-react";
import Toast from "../../../components/Toast";
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SiteHeader } from '@/components/site-header'

interface AnalyticsSummary {
  totalSites: number;
  totalPages: number;
  avgLLMReadiness: number;
}

interface AnalysisJob {
  id: string;
  siteName: string;
  pageUrl: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      
      try {
        const token = await getToken();
        if (!token) {
          setError("Failed to get authentication token");
          return;
        }
        
        // Mock data for now
        setSummary({
          totalSites: 5,
          totalPages: 23,
          avgLLMReadiness: 84.5
        });
        
        setJobs([
          {
            id: "1",
            siteName: "Example Site",
            pageUrl: "https://example.com/page1",
            status: "completed",
            startedAt: "2024-01-01T10:00:00Z",
            finishedAt: "2024-01-01T10:05:00Z"
          },
          {
            id: "2",
            siteName: "Demo Site",
            pageUrl: "https://demo.com/about",
            status: "running",
            startedAt: "2024-01-01T11:00:00Z"
          }
        ]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
        setToast({ message: "Failed to load analytics data", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [isLoaded, isSignedIn, getToken, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
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
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">
              Track your SEO performance and LLM optimization progress across all your sites.
            </p>
          </div>

          {/* Summary Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sites Analyzed</p>
                      <p className="text-3xl font-bold text-gray-900">{summary.totalSites}</p>
                      <p className="text-sm text-green-600 mt-1">↑ 12% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pages Optimized</p>
                      <p className="text-3xl font-bold text-gray-900">{summary.totalPages}</p>
                      <p className="text-sm text-green-600 mt-1">↑ 8% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. LLM Readiness</p>
                      <p className="text-3xl font-bold text-gray-900">{summary.avgLLMReadiness}%</p>
                      <p className="text-sm text-green-600 mt-1">↑ 15% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Recent Analysis Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Analysis Jobs</CardTitle>
              <CardDescription>
                Latest SEO analysis and optimization jobs across your sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">{error}</div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis jobs yet</h3>
                  <p className="text-gray-600">Start analyzing your sites to see detailed analytics here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium text-gray-900">{job.siteName}</div>
                          <Badge 
                            variant={job.status === 'completed' ? 'default' : job.status === 'running' ? 'secondary' : 'outline'}
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{job.pageUrl}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Started: {new Date(job.startedAt).toLocaleString()}
                          {job.finishedAt && ` • Completed: ${new Date(job.finishedAt).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
        </div>
        </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 