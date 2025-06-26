"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth";
import Toast from "../../../components/Toast";

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
  const { token } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const summaryRes = await fetch("http://localhost:3001/api/v1/analytics/summary", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const jobsRes = await fetch("http://localhost:3001/api/v1/analytics/recent-jobs", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!summaryRes.ok || !jobsRes.ok) throw new Error("Failed to load analytics");
        setSummary(await summaryRes.json());
        setJobs(await jobsRes.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
        setToast({ message: err instanceof Error ? err.message : "Failed to load analytics", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [token, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Analytics & Reporting</h1>
        {loading ? (
          <div>Loading analytics...</div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-3xl font-bold">{summary.totalSites}</div>
                <div className="text-gray-600">Total Sites</div>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-3xl font-bold">{summary.totalPages}</div>
                <div className="text-gray-600">Total Pages</div>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-3xl font-bold">{summary.avgLLMReadiness.toFixed(2)}</div>
                <div className="text-gray-600">Avg. LLM Readiness</div>
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2">Recent Analysis Jobs</h2>
            <ul className="divide-y">
              {jobs.map(job => (
                <li key={job.id} className="py-3">
                  <div className="font-semibold">{job.siteName}</div>
                  <div className="text-sm text-gray-600">{job.pageUrl}</div>
                  <div className="text-xs text-gray-400">Status: {job.status}</div>
                  <div className="text-xs text-gray-400">Started: {new Date(job.startedAt).toLocaleString()}</div>
                  {job.finishedAt && <div className="text-xs text-gray-400">Finished: {new Date(job.finishedAt).toLocaleString()}</div>}
                </li>
              ))}
              {jobs.length === 0 && <li className="py-3 text-gray-500">No recent jobs.</li>}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
} 