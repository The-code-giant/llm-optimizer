"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../lib/auth";
import { getSiteDetails, getPages, Page, SiteDetails, importSitemap } from "../../../lib/api";
import Toast from "../../../components/Toast";

export default function SiteDetailsPage() {
  const router = useRouter();
  const { siteId } = useParams() as { siteId: string };
  const { token } = useAuth();
  const [site, setSite] = useState<SiteDetails | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!token || !siteId) {
      router.replace("/login");
      return;
    }
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (!token || !siteId) return;
        const [siteData, pagesData] = await Promise.all([
          getSiteDetails(token, siteId),
          getPages(token, siteId),
        ]);
        setSite(siteData);
        setPages(pagesData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load site details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, siteId, router]);

  async function handleImportSitemap(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !siteId) return;
    setImporting(true);
    setError(null);
    try {
      await importSitemap(token, siteId, sitemapUrl);
      setToast({ message: "Sitemap import started!", type: "success" });
      setSitemapUrl("");
      // Optionally refresh pages after import
      const pagesData = await getPages(token, siteId);
      setPages(pagesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import sitemap");
      setToast({ message: err instanceof Error ? err.message : "Failed to import sitemap", type: "error" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        {loading ? (
          <div>Loading site details...</div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : site ? (
          <>
            <h1 className="text-2xl font-bold mb-2">{site.name}</h1>
            <div className="mb-4 text-gray-600">{site.url}</div>
            <div className="mb-6 text-xs text-gray-400">Tracker ID: {site.trackerId}</div>
            <form onSubmit={handleImportSitemap} className="mb-6 flex gap-2 flex-col sm:flex-row">
              <input
                type="url"
                placeholder="Sitemap URL (https://yoursite.com/sitemap.xml)"
                value={sitemapUrl}
                onChange={e => setSitemapUrl(e.target.value)}
                required
                className="rounded border px-3 py-2 flex-1"
                disabled={importing}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={importing}
              >
                {importing ? "Importing..." : "Import Sitemap"}
              </button>
            </form>
            <h2 className="text-lg font-semibold mb-2">Pages</h2>
            <ul className="divide-y">
              {pages.map(page => (
                <li key={page.id} className="py-3">
                  <div className="font-semibold">{page.title || page.url}</div>
                  <div className="text-sm text-gray-600">{page.url}</div>
                  <div className="text-xs text-gray-400">LLM Readiness Score: {page.llmReadinessScore}</div>
                  <a
                    href={`/dashboard/${siteId}/pages/${page.id}`}
                    className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                  >
                    View Analysis
                  </a>
                </li>
              ))}
              {pages.length === 0 && <li className="py-3 text-gray-500">No pages found.</li>}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
} 