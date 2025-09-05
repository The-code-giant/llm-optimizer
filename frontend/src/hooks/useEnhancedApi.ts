/**
 * React hook for enhanced API calls with automatic token refresh
 */
import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import { addPageWithRetry, triggerAnalysisWithRetry, getPageAnalysisWithRetry } from "@/lib/api-enhanced";
import type { Page, AnalysisResult } from "@/lib/api";

export function useEnhancedApi() {
  const { getToken } = useAuth();

  const addPage = useCallback(async (siteId: string, url: string): Promise<Page> => {
    return addPageWithRetry(getToken, siteId, url);
  }, [getToken]);

  const triggerAnalysis = useCallback(async (pageId: string): Promise<void> => {
    return triggerAnalysisWithRetry(getToken, pageId);
  }, [getToken]);

  const getPageAnalysis = useCallback(async (pageId: string): Promise<AnalysisResult> => {
    return getPageAnalysisWithRetry(getToken, pageId);
  }, [getToken]);

  return {
    addPage,
    triggerAnalysis,
    getPageAnalysis,
  };
}
