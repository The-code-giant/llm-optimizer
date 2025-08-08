"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addPage } from "@/lib/api";
import { Plus } from "lucide-react";

interface AddSinglePageFormProps {
  siteId: string;
  siteUrl: string;
  onToast?: (toast: { message: string; type: "success" | "error" | "info" }) => void;
}

export default function AddSinglePageForm({ siteId, siteUrl, onToast }: AddSinglePageFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();

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
    try {
      const token = await getToken();
      if (!token || !siteId) {
        onToast?.({ message: "Failed to get authentication token", type: "error" });
        return;
      }
      const created = await addPage(token, siteId, values.url);
      onToast?.({ message: "Page added successfully!", type: "success" });
      form.reset();
      router.push(`/dashboard/${siteId}/pages/${created.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add page";
      onToast?.({ message: errorMessage, type: "error" });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
      <label className="text-sm font-medium">Page URL</label>
      <Input
        type="url"
        placeholder={siteHostname ? `https://${siteHostname}/path` : "https://example.com/page"}
        {...form.register("url")}
      />
      {form.formState.errors.url?.message && (
        <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
      )}
      <Button type="submit" className="w-full mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Add Page
      </Button>
    </form>
  );
}


