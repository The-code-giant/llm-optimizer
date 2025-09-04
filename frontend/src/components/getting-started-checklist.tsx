"use client";

import { CheckCircle, Target } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface GettingStartedChecklistProps {
  site: {
    trackerId?: string;
  } | null;
  pages: Array<{ id: string; title?: string; url: string; llmReadinessScore?: number; lastScannedAt: string }>;
  recentlyScanned: number;
  pagesAbove80: number;
  onShowTrackerScript: () => void;
  onShowPageManagement: () => void;
  onSetActiveTab: (tab: "overview" | "analytics") => void;
  onSetScoreFilter: (filter: "all" | "high" | "medium" | "low") => void;
}

export default function GettingStartedChecklist({
  site,
  pages,
  recentlyScanned,
  pagesAbove80,
  onShowTrackerScript,
  onShowPageManagement,
  onSetActiveTab,
  onSetScoreFilter,
}: GettingStartedChecklistProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Getting Started
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Setup */}
          <div 
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={!site?.trackerId ? onShowTrackerScript : undefined}
          >
            {site?.trackerId ? (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
            )}
            <span className="text-sm flex-1">Install tracker script</span>
            {!site?.trackerId && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
            {/* /TODO this should send a request to main added site and check if user install tracker or not */}
          </div>
          
          <div 
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={pages.length === 0 ? onShowPageManagement : undefined}
          >
            {pages.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
            )}
            <span className="text-sm flex-1">Import pages ({pages.length})</span>
            {pages.length === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-5 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowPageManagement();
                }}
              >
                Add
              </Button>
            )}
          </div>
          
          {/* Analysis */}
          <div 
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={pages.length > 0 ? () => onSetActiveTab("overview") : undefined}
          >
            {recentlyScanned > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
            )}
            <span className="text-sm flex-1">Analyze content ({recentlyScanned} done)</span>
            {pages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-5 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetActiveTab("overview");
                }}
              >
                View
              </Button>
            )}
          </div>
          
          <div 
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={pages.length > 0 ? () => {
              onSetScoreFilter("low");
              onSetActiveTab("overview");
            } : undefined}
          >
            {pagesAbove80 > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
            )}
            <span className="text-sm flex-1">Optimize low scores ({pagesAbove80}/{pages.length})</span>
            {pages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-5 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetScoreFilter("low");
                  onSetActiveTab("overview");
                }}
              >
                Fix
              </Button>
            )}
          </div>
          
          {/* Progress */}
          {pages.length > 0 && (
            <div className="pt-1.5 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round((pagesAbove80 / pages.length) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.round((pagesAbove80 / pages.length) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
