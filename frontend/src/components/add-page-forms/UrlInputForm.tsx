"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Plus, 
  Sparkles, 
  CheckCircle, 
  Globe
} from "lucide-react";

interface UrlInputFormProps {
  onSubmit: (values: { url: string }) => Promise<void>;
  adding: boolean;
  progress: number;
  phase: "validating" | "creating" | "analyzing" | "finalizing" | null;
  formError: string | null;
  siteHostname: string | null;
}

export default function UrlInputForm({ 
  onSubmit, 
  adding, 
  progress, 
  phase, 
  formError, 
  siteHostname 
}: UrlInputFormProps) {
  console.log("UrlInputForm: siteHostname", formError);
  const schema = z
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
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { url: "" },
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Add New Page</h3>
        <p className="text-sm text-muted-foreground">
          Enter the URL of the page you want to add and optimize
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-destructive">{formError}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="url">Page URL</Label>
          <Input
            id="url"
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Adding Page</CardTitle>
              <CardDescription>
                This may take ~5–10 seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span>Adding page</span>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
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
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full" disabled={adding}>
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
    </div>
  );
}

