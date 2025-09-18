"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Loader2, Sparkles, CheckCircle, AlertCircle, Zap, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addSite } from "@/lib/api";

// Enhanced URL validation with Zod
const urlSchema = z
  .string()
  .min(1, "Website URL is required")
  .trim()
  .toLowerCase()
  .refine((url) => {
    // Check if URL starts with protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    return true;
  }, "URL must start with http:// or https://")
  .refine((url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }, "Please enter a valid URL format")
  .refine((url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.length > 0 && urlObj.hostname.includes('.');
    } catch {
      return false;
    }
  }, "URL must have a valid domain with at least one dot (e.g., example.com)")
  .refine((url) => {
    try {
      const urlObj = new URL(url);
      // Check for common invalid domains
      const invalidDomains = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      return !invalidDomains.includes(urlObj.hostname);
    } catch {
      return false;
    }
  }, "Localhost and IP addresses are not allowed")
  .refine((url) => {
    try {
      const urlObj = new URL(url);
      // Check for valid TLD (top-level domain)
      const hostnameParts = urlObj.hostname.split('.');
      return hostnameParts.length >= 2 && hostnameParts[hostnameParts.length - 1].length >= 2;
    } catch {
      return false;
    }
  }, "URL must have a valid top-level domain (e.g., .com, .org, .net)")
  .transform((url) => {
    // Normalize URL: ensure it ends with trailing slash and is lowercase
    let normalizedUrl = url.toLowerCase().trim();
    
    // Add protocol if missing
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Ensure URL ends with trailing slash for consistency
    if (!normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl + '/';
    }
    
    return normalizedUrl;
  });

// Zod schema for form validation with enhanced Firecrawl options
const addSiteSchema = z.object({
  name: z
    .string()
    .min(1, "Site name is required")
    .min(2, "Site name must be at least 2 characters")
    .max(100, "Site name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Site name can only contain letters, numbers, spaces, hyphens, and underscores")
    .trim(),
  url: z.string().min(1, "URL is required"),
  autoCrawl: z.boolean(),
  maxPages: z.number().min(1).max(50),
});

type AddSiteFormData = z.infer<typeof addSiteSchema>;

interface AddSiteModalProps {
  onSiteAdded: (siteId?: string) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function AddSiteModal({ onSiteAdded, onSuccess }: Omit<AddSiteModalProps, 'onError'>) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const { getToken } = useAuth();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"validating" | "analyzing" | "finalizing" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<AddSiteFormData>({
    resolver: zodResolver(addSiteSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      url: "",
      autoCrawl: true,
      maxPages: 10,
    },
  });

  const watchedUrl = watch("url");

  const onSubmit = async (data: AddSiteFormData) => {
    setAdding(true);
    setPhase("validating");
    setProgress(10);
    setFormError(null);

    try {
      const token = await getToken();
      if (!token) {
        setFormError("Failed to get authentication token");
        return;
      }

      // Enhanced progress phases for Firecrawl integration
      const ticker = setInterval(() => {
        setProgress((p) => {
          const next = Math.min(85, p + 3 + Math.random() * 4);
          // Move through phases as progress increases
          setPhase((ph) => {
            if (next > 25 && ph === "validating") return "analyzing";
            if (next > 60 && ph === "analyzing") return "finalizing";
            return ph;
          });
          return next;
        });
      }, 500);

      // Call enhanced addSite with Firecrawl options
      const newSite = await addSite(token, data.name, data.url, {
        autoCrawl: data.autoCrawl,
        maxPages: data.maxPages,
      });
      
      clearInterval(ticker);

      // Finish the staged steps so users can see Analyzing and Finalizing
      // Step 1: ensure we show analyzing (if not already), bump progress
      setPhase((ph) => (ph === "validating" ? "analyzing" : ph));
      setProgress((p) => (p < 92 ? 92 : p));
      await new Promise((r) => setTimeout(r, 500));

      // Step 2: finalizing
      setPhase("finalizing");
      setProgress(98);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: complete
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      // Reset form and close modal
      reset();
      setOpen(false);
      setPhase(null);
      setProgress(0);
      setFormError(null);

      // Notify parent and show success on the main page
      onSiteAdded(newSite.id);
      onSuccess("Site added successfully!");
    } catch (err: unknown) {
      setPhase(null);
      setProgress(0);
      // Keep modal open and show error inside the form (no page-level toast)
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to add site. Please verify the URL is correct and publicly accessible, then try again."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[520px] !bg-white dark:!bg-gray-900 border border-border shadow-lg backdrop-blur-none opacity-100"
        style={{ backgroundColor: 'white' }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add New Website</DialogTitle>
            <DialogDescription>
              Add a new website to start optimizing it for LLM and search engines. With enhanced Firecrawl integration, we&apos;ll automatically discover and analyze your pages with superior content extraction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
                {formError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">{formError}</p>
                  </div>
                )}
            <div className="grid gap-2">
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="My Awesome Website"
                {...register("name")}
                disabled={adding}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://yoursite.com"
                {...register("url")}
                disabled={adding}
                className={errors.url ? "border-red-500" : ""}
              />
              {errors.url && (
                <p className="text-sm text-red-500">{errors.url.message}</p>
              )}
              {watchedUrl && !errors.url && (
                <p className="text-sm text-green-600">
                  ✓ Valid URL format
                </p>
              )}
            </div>

            {/* Enhanced Firecrawl Options */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-discover Pages</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically find and analyze up to {watch("maxPages") || 10} pages using advanced web crawling
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("autoCrawl")}
                    disabled={adding}
                    className="h-4 w-4"
                  />
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>
              </div>

              {watch("autoCrawl") && (
                <div className="space-y-2">
                  <Label htmlFor="maxPages">Maximum Pages to Discover</Label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      {...register("maxPages", { valueAsNumber: true })}
                      disabled={adding}
                      className="flex-1"
                    />
                    <span className="min-w-[3ch] text-sm font-medium">
                      {watch("maxPages") || 10}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Search className="h-3 w-3" />
                    <span>Higher quality content extraction with Firecrawl</span>
                  </div>
                </div>
              )}
            </div>

                {adding && (
                  <div className="rounded-md border bg-muted p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                        <span>Setting up your site</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <div className="h-2 bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        {phase === "validating" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        )}
                        <span>Validating website URL</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        {phase === "analyzing" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : phase === "finalizing" || phase === null ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span>Discovering pages with Firecrawl{watch("autoCrawl") ? ` (up to ${watch("maxPages")} pages)` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        {phase === "finalizing" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : phase === null && progress === 100 ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span>Extracting enhanced content</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {watch("autoCrawl") 
                        ? `Enhanced crawling with Firecrawl for better content extraction. May take 20-60 seconds for ${watch("maxPages")} pages.`
                        : "This may take ~10–20 seconds if your site is slow to respond."
                      }
                    </p>
                  </div>
                )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={adding || !isValid}
              className="min-w-[100px]"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Site"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 