"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getPageAnalysis, AnalysisResult, triggerAnalysis } from "../../../../../lib/api";
import Toast from "../../../../../components/Toast";

export default function PageAnalysisPage() {
  const router = useRouter();
  const { pageId } = useParams() as { pageId: string };
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn || !pageId) {
      router.replace("/login");
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token || !pageId) {
          setError("Failed to get authentication token");
          return;
        }
        const data = await getPageAnalysis(token, pageId);
        setAnalysis(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isLoaded, isSignedIn, getToken, pageId, router]);

  async function handleTriggerAnalysis() {
    setTriggering(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token || !pageId) {
        setError("Failed to get authentication token");
        return;
      }
      await triggerAnalysis(token, pageId);
      setToast({ message: "Analysis started!", type: "success" });
      // Optionally refresh analysis result after a delay
      setTimeout(async () => {
        const token = await getToken();
        if (!token || !pageId) return;
        const data = await getPageAnalysis(token, pageId);
        setAnalysis(data);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to trigger analysis");
      setToast({ message: err instanceof Error ? err.message : "Failed to trigger analysis", type: "error" });
    } finally {
      setTriggering(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        {loading ? (
          <div>Loading analysis...</div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : analysis ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Page Analysis</h1>
            <button
              onClick={handleTriggerAnalysis}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={triggering}
            >
              {triggering ? "Starting..." : "Trigger New Analysis"}
            </button>
            <div className="mb-4">
              <strong>Summary:</strong>
              <div className="mt-1 text-gray-700">{analysis.summary}</div>
            </div>
            <div className="mb-4">
              <strong>Issues:</strong>
              <ul className="list-disc list-inside text-gray-700 mt-1">
                {analysis.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
                {analysis.issues.length === 0 && <li>No issues found.</li>}
              </ul>
            </div>
            <div className="mb-4">
              <strong>Recommendations:</strong>
              <ul className="list-disc list-inside text-gray-700 mt-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
                {analysis.recommendations.length === 0 && <li>No recommendations.</li>}
              </ul>
            </div>
            <div className="text-xs text-gray-400 mt-4">Analysis generated at: {analysis.createdAt}</div>
          </>
        ) : null}
      </div>
    </div>
  );
} 