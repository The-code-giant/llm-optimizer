"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, CheckCircle, XCircle, Download } from "lucide-react";
import { importSitemap, getPages, Page } from "@/lib/api";

interface ImportSitemapFormProps {
  siteId: string;
  onPagesUpdated?: (pages: Page[]) => void;
  onToast?: (toast: { message: string; type: "success" | "error" | "info" }) => void;
}

interface ImportProgress {
  status: "idle" | "importing" | "processing" | "completed" | "error";
  total?: number;
  processed?: number;
  message?: string;
}

export default function ImportSitemapForm({ siteId, onPagesUpdated, onToast }: ImportSitemapFormProps) {
  const { getToken } = useAuth();
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ status: "idle" });

  const handleImportSitemap = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setImportProgress({ status: "importing", message: "Fetching sitemap..." });

    try {
      const token = await getToken();
      if (!token || !siteId) {
        onToast?.({ message: "Failed to get authentication token", type: "error" });
        return;
      }

      if (!sitemapUrl.includes("sitemap")) {
        throw new Error("URL doesn't appear to be a valid sitemap");
      }

      setImportProgress({ status: "processing", message: "Processing sitemap entries..." });
      await importSitemap(token, siteId, sitemapUrl);

      setImportProgress({ status: "completed", message: "Sitemap imported successfully!" });
      onToast?.({ message: "Sitemap import completed! Refreshing pages...", type: "success" });
      setSitemapUrl("");

      setTimeout(async () => {
        const pagesData = await getPages(token, siteId);
        onPagesUpdated?.(pagesData);
        setImportProgress({ status: "idle" });
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import sitemap";
      setImportProgress({ status: "error", message: errorMessage });
      onToast?.({ message: errorMessage, type: "error" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <form onSubmit={handleImportSitemap} className="space-y-4">
      <Input
        type="url"
        placeholder="https://yoursite.com/sitemap.xml"
        value={sitemapUrl}
        onChange={(e) => setSitemapUrl(e.target.value)}
        required
        disabled={importing}
      />

      {importProgress.status !== "idle" && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {importProgress.status === "importing" && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            )}
            {importProgress.status === "processing" && (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
            {importProgress.status === "completed" && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {importProgress.status === "error" && (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">{importProgress.message}</span>
          </div>
        </div>
      )}

      <Button type="submit" disabled={importing} className="w-full">
        {importing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Import Sitemap
          </>
        )}
      </Button>
    </form>
  );
}


