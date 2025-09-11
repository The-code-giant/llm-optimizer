"use client";

import { CheckCircle, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteDetails, Page } from "@/lib/api";

interface SiteGettingStartedChecklistProps {
  site: SiteDetails | null;
  pages: Page[];
  recentlyScanned: number;
  onShowTrackerScript: () => void;
  onSetActiveTab: (tab: "overview" | "analytics") => void;
}

export function SiteGettingStartedChecklist({
  site,
  pages,
  recentlyScanned,
  onShowTrackerScript,
  onSetActiveTab,
}: SiteGettingStartedChecklistProps) {
  return (
    <Card className='gap-1'>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1 text-base">
          <Target className="h-4 w-4" />
          Getting Started
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground text-xs">
            Complete these steps to get started.
          </p>
          <div className="space-y-2">
            {/* Install tracker script */}
            <div 
              className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={onShowTrackerScript}
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span className="font-medium text-sm">Install tracker script</span>
              </div>
              {site?.trackerId ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              )}
            </div>

            {/* Import pages */}
            <div 
              className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Import pages</span>
                  <span className="text-xs text-muted-foreground">({pages.length})</span>
                </div>
              </div>
              {pages.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              )}
            </div>

            {/* Analyze content */}
            <div 
              className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={pages.length > 0 ? () => onSetActiveTab("overview") : undefined}
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Analyze content</span>
                  <span className="text-xs text-muted-foreground">({recentlyScanned} done)</span>
                </div>
              </div>
              {recentlyScanned > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
