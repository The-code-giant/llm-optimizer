"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Search, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { rediscoverSitePages } from "@/lib/api";

interface RediscoverPagesButtonProps {
  siteId: string;
  siteName?: string;
  onPagesRediscovered?: (result: {
    pagesDiscovered: number;
    pagesAnalyzed: number;
    errors: string[];
  }) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function RediscoverPagesButton({
  siteId,
  siteName,
  onPagesRediscovered,
  onSuccess,
  onError,
}: RediscoverPagesButtonProps) {
  const [open, setOpen] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [maxPages, setMaxPages] = useState(10);
  const [result, setResult] = useState<{
    pagesDiscovered: number;
    pagesAnalyzed: number;
    errors: string[];
  } | null>(null);
  const { getToken } = useAuth();

  const handleRediscover = async () => {
    setDiscovering(true);
    setResult(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const discoveryResult = await rediscoverSitePages(token, siteId, maxPages);
      
      if (discoveryResult.success) {
        setResult({
          pagesDiscovered: discoveryResult.pagesDiscovered,
          pagesAnalyzed: discoveryResult.pagesAnalyzed,
          errors: discoveryResult.errors,
        });
        
        onPagesRediscovered?.(discoveryResult);
        onSuccess?.(
          `Successfully discovered ${discoveryResult.pagesDiscovered} new pages with enhanced content extraction!`
        );
      } else {
        throw new Error("Page rediscovery failed");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to rediscover pages";
      onError?.(errorMessage);
      setResult({
        pagesDiscovered: 0,
        pagesAnalyzed: 0,
        errors: [errorMessage],
      });
    } finally {
      setDiscovering(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Rediscover Pages
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Rediscover Pages with Firecrawl
          </DialogTitle>
          <DialogDescription>
            Use enhanced Firecrawl technology to discover new pages{siteName ? ` on ${siteName}` : ""} 
            with superior content extraction.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="maxPages">Maximum Pages to Discover</Label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value))}
                disabled={discovering}
                className="flex-1"
              />
              <span className="min-w-[3ch] text-sm font-medium">
                {maxPages}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher limits may take longer but discover more content
            </p>
          </div>

          {discovering && (
            <div className="rounded-md border bg-muted p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Discovering pages with Firecrawl...</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                This may take 30-90 seconds for enhanced content extraction
              </p>
            </div>
          )}

          {result && !discovering && (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center gap-2">
                {result.pagesDiscovered > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-medium">Discovery Complete</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>New pages found:</span>
                  <span className="font-medium">{result.pagesDiscovered}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pages analyzed:</span>
                  <span className="font-medium">{result.pagesAnalyzed}</span>
                </div>
                {result.errors.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Issues encountered:</p>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      {result.errors.slice(0, 3).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {result.errors.length > 3 && (
                        <li>• And {result.errors.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={discovering}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleRediscover} disabled={discovering}>
              {discovering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Start Discovery
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RediscoverPagesButton;