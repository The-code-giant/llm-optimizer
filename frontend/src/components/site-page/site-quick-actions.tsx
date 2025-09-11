"use client";

import { RefreshCw, Settings, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ImportSitemapForm from "@/components/ImportSitemapForm";
import { SiteGettingStartedChecklist } from "./site-getting-started-checklist";
import { SiteDetails, Page } from "@/lib/api";

interface SiteQuickActionsProps {
  site: SiteDetails;
  pages: Page[];
  recentlyScanned: number;
  siteId: string;
  onShowTrackerScript: () => void;
  onSetActiveTab: (tab: "overview" | "analytics") => void;
  onPagesUpdated: (pages: Page[]) => void;
  onToast: (toast: { message: string; type: "success" | "error" | "info" }) => void;
  onRefresh: () => void;
  onShowSettings: () => void;
}

export function SiteQuickActions({
  site,
  pages,
  recentlyScanned,
  siteId,
  onShowTrackerScript,
  onSetActiveTab,
  onPagesUpdated,
  onToast,
  onRefresh,
  onShowSettings,
}: SiteQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card data-tour="quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your site&apos; tracker, content deployment, and site settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onShowTrackerScript}
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Get Script
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center"
                  data-tour="add-pages"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Sitemap
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Import Sitemap
                  </DialogTitle>
                  <DialogDescription>
                    Bulk import pages from your website&apos;s sitemap
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6">
                  <ImportSitemapForm
                    siteId={siteId}
                    onPagesUpdated={onPagesUpdated}
                    onToast={onToast}
                  />
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={onShowSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <SiteGettingStartedChecklist
        site={site}
        pages={pages}
        recentlyScanned={recentlyScanned}
        onShowTrackerScript={onShowTrackerScript}
        onSetActiveTab={onSetActiveTab}
      />
    </div>
  );
}
