"use client";

import { Settings, Upload, BarChart3, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ImportSitemapForm from "@/components/ImportSitemapForm";
import { SiteGettingStartedChecklist } from "./site-getting-started-checklist";
import { SiteDetails, Page } from "@/lib/api";

interface SiteDashboardOverviewProps {
  site: SiteDetails;
  pages: Page[];
  recentlyScanned: number;
  siteId: string;
  averageLLMScore: number;
  pagesAbove75: number;
  onShowTrackerScript: () => void;
  onSetActiveTab: (tab: "overview" | "analytics") => void;
  onPagesUpdated: (pages: Page[]) => void;
  onToast: (toast: { message: string; type: "success" | "error" | "info" }) => void;
  onShowSettings: () => void;
}

export function SiteDashboardOverview({
  site,
  pages,
  recentlyScanned,
  siteId,
  averageLLMScore,
  pagesAbove75,
  onShowTrackerScript,
  onSetActiveTab,
  onPagesUpdated,
  onToast,
  onShowSettings,
}: SiteDashboardOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs">
              Manage your site&apos;s tracker, content deployment, and site settings.
            </p>
            <div className="space-y-1">
              {/* Get Script */}
              <div 
                className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={onShowTrackerScript}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span className="font-medium text-sm">Get Script</span>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Import Sitemap */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <span className="font-medium text-sm">Import Sitemap</span>
                    </div>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Import Sitemap</DialogTitle>
                    <DialogDescription>
                      Import your website&apos;s sitemap to automatically add pages for analysis
                    </DialogDescription>
                  </DialogHeader>
                  <ImportSitemapForm
                    siteId={siteId}
                    onPagesUpdated={onPagesUpdated}
                    onToast={onToast}
                  />
                </DialogContent>
              </Dialog>

              {/* Settings */}
              <div 
                className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={onShowSettings}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <span className="font-medium text-sm">Settings</span>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <SiteGettingStartedChecklist
        site={site}
        pages={pages}
        recentlyScanned={recentlyScanned}
        onShowTrackerScript={onShowTrackerScript}
        onSetActiveTab={onSetActiveTab}
      />

      {/* Performance Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs">
              Key performance metrics for your site.
            </p>
            <div className="space-y-1">
              {/* Average LLM Score */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 transition-colors cursor-help">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                        <span className="font-medium text-sm">Avg LLM Score</span>
                      </div>
                      <div className="text-sm font-medium">{averageLLMScore}%</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average readiness score across all pages ({averageLLMScore}%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* High Quality Pages */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 transition-colors cursor-help">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">H</span>
                        </div>
                        <span className="font-medium text-sm">High Quality</span>
                      </div>
                      <div className="text-sm font-medium">{pagesAbove75}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pages with 75%+ readiness score ({pagesAbove75} pages)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}