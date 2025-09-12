"use client";

import { CheckCircle, Target, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteDetails, Page, checkTrackerInstallation } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

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
  const { getToken } = useAuth();
  const [isCheckingTracker, setIsCheckingTracker] = useState(false);
  const [trackerInstalled, setTrackerInstalled] = useState<boolean | null>(null);

  const checkTrackerStatus = useCallback(async () => {
    if (!site?.id || !getToken) return;
    
    console.log(`🔄 Frontend: Starting tracker check for site: ${site.id}`);
    setIsCheckingTracker(true);
    try {
      const token = await getToken();
      if (!token) {
        console.log(`❌ Frontend: No auth token available`);
        return;
      }
      
      console.log(`🌐 Frontend: Calling checkTrackerInstallation API...`);
      const result = await checkTrackerInstallation(token, site.id);
      console.log(`📋 Frontend: API response:`, result);
      
      setTrackerInstalled(result.isInstalled);
      console.log(`✅ Frontend: Tracker installed status set to: ${result.isInstalled}`);
    } catch (error) {
      console.error('❌ Frontend: Failed to check tracker installation:', error);
      setTrackerInstalled(false);
    } finally {
      setIsCheckingTracker(false);
      console.log(`🏁 Frontend: Tracker check completed`);
    }
  }, [site?.id, getToken]);

  // Check tracker installation when component mounts or site changes
  useEffect(() => {
    console.log(`🎯 Frontend: useEffect triggered - site?.id: ${site?.id}, site?.trackerId: ${site?.trackerId}`);
    if (site?.id && site?.trackerId) {
      console.log(`🚀 Frontend: Auto-checking tracker status...`);
      checkTrackerStatus();
    } else {
      console.log(`⏸️ Frontend: Skipping auto-check - missing site ID or tracker ID`);
    }
  }, [site?.id, site?.trackerId, checkTrackerStatus]);

  // Determine if tracker is installed
  const isTrackerInstalled = trackerInstalled !== null ? trackerInstalled : !!site?.trackerId;

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
              <div className="flex items-center gap-2">
                {site?.trackerId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      checkTrackerStatus();
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    disabled={isCheckingTracker}
                    title="Check if tracker is installed"
                  >
                    <RefreshCw className={`h-3 w-3 text-gray-500 ${isCheckingTracker ? 'animate-spin' : ''}`} />
                  </button>
                )}
                {isCheckingTracker ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : isTrackerInstalled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                )}
              </div>
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
