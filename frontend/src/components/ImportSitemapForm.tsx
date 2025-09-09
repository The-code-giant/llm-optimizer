"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Clock, CheckCircle, XCircle, Download, Globe, FileText, Database } from "lucide-react";
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
  progress?: number;
}

export default function ImportSitemapForm({ siteId, onPagesUpdated, onToast }: ImportSitemapFormProps) {
  const { getToken } = useAuth();
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ status: "idle" });

  const handleImportSitemap = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setImportProgress({ 
      status: "importing", 
      message: "Fetching sitemap...", 
      progress: 10 
    });

    try {
      const token = await getToken();
      if (!token || !siteId) {
        onToast?.({ message: "Failed to get authentication token", type: "error" });
        return;
      }

      if (!sitemapUrl.includes("sitemap")) {
        throw new Error("URL doesn't appear to be a valid sitemap");
      }

      setImportProgress({ 
        status: "processing", 
        message: "Processing sitemap entries...", 
        progress: 50 
      });
      
      await importSitemap(token, siteId, sitemapUrl);

      setImportProgress({ 
        status: "completed", 
        message: "Sitemap imported successfully!", 
        progress: 100 
      });
      
      onToast?.({ message: "Sitemap import completed! Refreshing pages...", type: "success" });
      setSitemapUrl("");

      setTimeout(async () => {
        const pagesData = await getPages(token, siteId);
        onPagesUpdated?.(pagesData);
        setImportProgress({ status: "idle" });
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import sitemap";
      setImportProgress({ 
        status: "error", 
        message: errorMessage, 
        progress: 0 
      });
      onToast?.({ message: errorMessage, type: "error" });
    } finally {
      setImporting(false);
    }
  };

  const getStatusIcon = () => {
    switch (importProgress.status) {
      case "importing":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (importProgress.status) {
      case "importing":
        return "bg-blue-50 border-blue-200";
      case "processing":
        return "bg-yellow-50 border-yellow-200";
      case "completed":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleImportSitemap} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="sitemap-url" className="text-sm font-medium text-gray-700">
            Sitemap URL
          </label>
          <Input
            id="sitemap-url"
            type="url"
            placeholder="https://yoursite.com/sitemap.xml"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            required
            disabled={importing}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Enter the URL of your website&apos;s sitemap.xml file
          </p>
        </div>

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

      {importProgress.status !== "idle" && (
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{importProgress.message}</span>
            </div>
            
            {importProgress.progress !== undefined && (
              <div className="space-y-2">
                <Progress value={importProgress.progress} className="w-full" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{importProgress.progress}% complete</span>
                  {importProgress.status === "processing" && (
                    <span>Processing pages...</span>
                  )}
                </div>
              </div>
            )}

            {importProgress.status === "completed" && (
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>All pages have been imported and analyzed successfully!</span>
              </div>
            )}

            {importProgress.status === "error" && (
              <div className="flex items-center space-x-2 text-sm text-red-700">
                <XCircle className="h-4 w-4" />
                <span>Import failed. Please check the sitemap URL and try again.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Globe className="h-4 w-4 mr-2" />
          How to find your sitemap
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Most websites have their sitemap at: <code className="bg-gray-200 px-1 rounded">yoursite.com/sitemap.xml</code></p>
          <p>• You can also check <code className="bg-gray-200 px-1 rounded">yoursite.com/robots.txt</code> for sitemap location</p>
          <p>• WordPress sites often use <code className="bg-gray-200 px-1 rounded">yoursite.com/sitemap_index.xml</code></p>
        </div>
      </div>
    </div>
  );
}


