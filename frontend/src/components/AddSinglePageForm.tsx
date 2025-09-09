"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResult } from "@/lib/api";
import { useEnhancedApi } from "@/hooks/useEnhancedApi";
import { UrlInputForm } from "./add-page-forms";

interface AddSinglePageFormProps {
  siteId: string;
  siteUrl: string;
  onCompleted?: () => void;
  onToast?: (toast: { message: string; type: "success" | "error" | "info" }) => void;
}

export default function AddSinglePageForm({ siteId, siteUrl, onCompleted, onToast }: AddSinglePageFormProps) {
  const router = useRouter();
  const { addPage, getPageAnalysis } = useEnhancedApi();
  
  // Form state
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"validating" | "creating" | "analyzing" | "finalizing" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const siteHostname = useMemo(() => {
    if (!siteUrl) return null;
    try {
      const u = new URL(siteUrl);
      return u.hostname.replace(/^www\./i, "");
    } catch {
      return null;
    }
  }, [siteUrl]);

  const handleSubmit = async (values: { url: string }) => {
    setAdding(true);
    setProgress(0);
    setPhase("validating");
    setFormError(null);

    try {
      // Step 1: Validate and create page
      setProgress(25);
      setPhase("creating");
      
      const created = await addPage(siteId, values.url);
      
      setProgress(50);
      setPhase("analyzing");
      
      // Analysis is now automatically triggered by the backend when creating a page
      setProgress(75);

      // Robust polling with exponential backoff + timeout + automatic token refresh
      const waitForAnalysis = async (
        pageId: string,
        {
          timeoutMs = 120_000,
          initialDelay = 1000,
          maxDelay = 10_000,
        }: { timeoutMs?: number; initialDelay?: number; maxDelay?: number } = {}
      ) => {
        const start = Date.now();
        let delay = initialDelay;

        while (Date.now() - start < timeoutMs) {
          try {
            // Use enhanced API with automatic token refresh
            const data: AnalysisResult = await getPageAnalysis(pageId);

            // Consider analysis complete if we have recommendations, issues, or a summary
            const hasRecommendations = Array.isArray(data.recommendations) && data.recommendations.length > 0;
            const hasIssues = Array.isArray(data.issues) && data.issues.length > 0;
            const hasSummary = Boolean(data.summary);

            if (hasRecommendations || hasIssues || hasSummary) {
              return data;
            }
          } catch (err) {
            // Check if it's an auth error that couldn't be resolved
            if (err instanceof Error && 'isAuthError' in err && err.isAuthError) {
              console.error("Authentication failed during polling:", err);
              throw new Error("Authentication failed. Please sign in again.");
            }
            // API may return 404 or an error while the job is not ready; ignore and continue polling
            console.debug("analysis not ready yet", err);
          }

          // bump progress slowly while waiting
          setProgress((p) => Math.min(95, p + 5));

          await new Promise((res) => setTimeout(res, delay));
          delay = Math.min(maxDelay, Math.floor(delay * 1.5));
        }

        throw new Error("analysis_timeout");
      };

  try {
    const analysisResult = await waitForAnalysis(created.id);
    if (analysisResult) {
      setProgress(100);
      setPhase(null);
    }
  } catch (err) {
    // Timeout waiting for analysis or auth error — proceed but inform user
  console.warn("Error waiting for analysis", err);
    setProgress(90);
    setPhase(null);
    if (err instanceof Error && err.message.includes("Authentication failed")) {
      onToast?.({ message: "Session expired. Please sign in again.", type: "error" });
      return;
    } else {
      onToast?.({ message: "Analysis may take longer than expected — navigating to the page now.", type: "info" });
    }
  }
      
      onToast?.({ message: "Page added and analysis started successfully!", type: "success" });
      
      // Close modal and navigate to the new page
      onCompleted?.();
      router.push(`/dashboard/${siteId}/pages/${created.id}`);
      
    } catch (error) {
      console.error("Error adding page:", error);
      setFormError("Failed to add page. Please try again.");
      onToast?.({ message: "Failed to add page", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="w-full">
      <UrlInputForm
        onSubmit={handleSubmit}
        adding={adding}
        progress={progress}
        phase={phase}
        formError={formError}
        siteHostname={siteHostname}
      />
    </div>
  );
}
