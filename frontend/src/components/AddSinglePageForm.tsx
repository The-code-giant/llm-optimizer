"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addPage, triggerAnalysis } from "@/lib/api";
import { Loader2, Plus, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

interface AddSinglePageFormProps {
  siteId: string;
  siteUrl: string;
  onCompleted?: () => void; // close parent modal/dialog
}

export default function AddSinglePageForm({ siteId, siteUrl, onCompleted }: AddSinglePageFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"validating" | "creating" | "analyzing" | "finalizing" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const siteHostname = useMemo(() => {
    if (!siteUrl) return null;
    try {
      const normalized = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
      const u = new URL(normalized);
      return u.hostname.replace(/^www\./i, "");
    } catch {
      return null;
    }
  }, [siteUrl]);

  const schema = useMemo(
    () =>
      z
        .object({ url: z.string().url("Enter a valid URL") })
        .refine((data) => {
          if (!siteHostname) return true;
          try {
            const u = new URL(data.url);
            const host = u.hostname.replace(/^www\./i, "");
            return host === siteHostname;
          } catch {
            return false;
          }
        }, {
          message: siteHostname ? `URL must be on ${siteHostname}` : "Enter a valid URL",
          path: ["url"],
        }),
    [siteHostname]
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { url: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setAdding(true);
    setFormError(null);
    setPhase("validating");
    setProgress(12);
    try {
      const token = await getToken();
      if (!token || !siteId) {
        setFormError("Failed to get authentication token");
        return;
      }
      // staged progress while awaiting server
      const ticker = setInterval(() => {
        setProgress((p) => {
          const next = Math.min(80, p + 5 + Math.random() * 5);
          if (next > 30 && phase === "validating") setPhase("creating");
          return next;
        });
      }, 400);

      // Create page
      const created = await addPage(token, siteId, values.url);
      clearInterval(ticker);

      // Ensure phases play out for UX
      setPhase((ph) => (ph === "validating" ? "creating" : ph));
      setProgress((p) => (p < 88 ? 88 : p));
      await new Promise((r) => setTimeout(r, 400));

      // Trigger analysis for the new page
      setPhase("analyzing");
      setProgress(94);
      await triggerAnalysis(token, created.id);
      await new Promise((r) => setTimeout(r, 500));

      // Finalize
      setPhase("finalizing");
      setProgress(98);
      await new Promise((r) => setTimeout(r, 400));
      setProgress(100);
      await new Promise((r) => setTimeout(r, 250));

      // Reset and navigate
      form.reset();
      onCompleted?.();
      router.push(`/dashboard/${siteId}/pages/${created.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add page";
      setFormError(errorMessage);
    }
    finally {
      setAdding(false);
      setPhase(null);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      {formError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{formError}</p>
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Page URL</label>
        <Input
          type="url"
          placeholder={siteHostname ? `https://${siteHostname}/path` : "https://example.com/page"}
          {...form.register("url")}
          disabled={adding}
        />
        {form.formState.errors.url?.message && (
          <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
        )}
      </div>
      {adding && (
        <div className="rounded-md border bg-muted p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Adding page</span>
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
              <span>Validating URL</span>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              {phase === "creating" ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : phase === "analyzing" || phase === "finalizing" ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <Loader2 className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Creating page</span>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              {phase === "analyzing" ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : phase === "finalizing" || (phase === null && progress === 100) ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <Loader2 className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Starting analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              {phase === "finalizing" ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : phase === null && progress === 100 ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <Loader2 className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Finalizing</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">This may take ~5–10 seconds.</p>
        </div>
      )}
      <Button type="submit" className="w-full mt-1" disabled={adding}>
        {adding ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </>
        )}
      </Button>
    </form>
  );
}


