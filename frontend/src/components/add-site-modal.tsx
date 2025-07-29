"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus } from "lucide-react";
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

// Zod schema for form validation
const addSiteSchema = z.object({
  name: z
    .string()
    .min(1, "Site name is required")
    .min(2, "Site name must be at least 2 characters")
    .max(100, "Site name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Site name can only contain letters, numbers, spaces, hyphens, and underscores")
    .trim(),
  url: urlSchema,
});

type AddSiteFormData = z.infer<typeof addSiteSchema>;

interface AddSiteModalProps {
  onSiteAdded: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function AddSiteModal({ onSiteAdded, onError, onSuccess }: AddSiteModalProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const { getToken } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<AddSiteFormData>({
    resolver: zodResolver(addSiteSchema),
    mode: "onChange",
  });

  const watchedUrl = watch("url");

  const onSubmit = async (data: AddSiteFormData) => {
    setAdding(true);

    try {
      const token = await getToken();
      if (!token) {
        onError("Failed to get authentication token");
        return;
      }

      await addSite(token, data.name, data.url);
      
      // Reset form and close modal
      reset();
      setOpen(false);
      
      // Notify parent component
      onSiteAdded();
      onSuccess("Site added successfully!");
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to add site");
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add New Website</DialogTitle>
            <DialogDescription>
              Add a new website to start optimizing it for LLM and search engines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            >
              {adding ? "Adding..." : "Add Site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 