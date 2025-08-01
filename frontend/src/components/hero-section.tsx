"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, SendHorizonal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitWebsiteUrl } from "@/lib/api";



// URL validation schema
const urlSchema = z.object({
  url: z.string()
    .min(1, "Website URL is required")
    .transform((url) => {
      // Normalize URL by adding https:// if no protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    })
    .pipe(
      z.string().url("Please enter a valid website URL")
    )
    .refine((url) => {
      const urlObj = new URL(url);
      
      // Only allow HTTP/HTTPS protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }
      
      // Must have a valid hostname with at least one dot
      const hostname = urlObj.hostname;
      return hostname && hostname.includes('.') && hostname.length >= 3;
    }, "Please enter a valid website domain (e.g., example.com)")
    .refine((url) => {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Check for valid domain characters (letters, numbers, hyphens, dots)
      const validDomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return validDomainRegex.test(hostname);
    }, "Please enter a valid website domain format")
});

type UrlFormData = z.infer<typeof urlSchema>;

export default function HeroSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: ""
    }
  });

  const onSubmit = async (data: UrlFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Normalize URL (add https:// if not present)
      let normalizedUrl = data.url;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const result = await submitWebsiteUrl(normalizedUrl);
      
      if (result.success && result.redirectUrl) {
        // Navigate to signup with the website URL as a parameter
        router.push(result.redirectUrl);
      } else {
        setError(result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit website URL. Please try again.');
      console.error('URL submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main>
        <section className="overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-6 py-28 lg:py-20">
            <div className="lg:flex lg:items-center lg:gap-12">
              <div className="relative z-10 mx-auto max-w-xl text-center lg:ml-0 lg:w-1/2 lg:text-left">
                <Link
                  href="/demo"
                  className="rounded-(--radius) mx-auto flex w-fit items-center gap-2 border p-1 pr-3 lg:ml-0"
                >
                  <span className="bg-muted rounded-[calc(var(--radius)-0.25rem)] px-2 py-1 text-xs">
                    New
                  </span>
                  <span className="text-sm">Book Demo </span>
                  <span className="bg-(--color-border) block h-4 w-px"></span>

                  <ArrowRight className="size-4" />
                </Link>

                <h1 className="mt-10 text-balance text-4xl font-bold md:text-5xl xl:text-5xl">
                  Boost Your Site&apos;s AI & SEO Visibility in Minutes
                </h1>
                <p className="mt-8">
                  Our AI-powered platform helps you optimize your website for
                  Large Language Models (LLMs) and search engines, ensuring
                  better visibility and citations.
                </p>

                <div>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mx-auto my-10 max-w-sm lg:my-12 lg:ml-0 lg:mr-auto"
                  >
                    <div className="bg-background has-[input:focus]:ring-muted relative grid grid-cols-[1fr_auto] items-center rounded-[calc(var(--radius)+0.75rem)] border pr-3 shadow shadow-zinc-950/5 has-[input:focus]:ring-2">
                      <Globe className="text-caption pointer-events-none absolute inset-y-0 left-5 my-auto size-5" />

                      <input
                        {...register("url")}
                        placeholder="Enter your website URL"
                        className="h-14 w-full bg-transparent pl-12 focus:outline-none"
                        type="text"
                        disabled={isSubmitting}
                      />

                      <div className="md:pr-1.5 lg:pr-0">
                        <Button
                          type="submit"
                          aria-label="submit"
                          className="rounded-(--radius)"
                          disabled={isSubmitting}
                        >
                          <span className="hidden md:block">
                            {isSubmitting ? "Analyzing..." : "Get Started"}
                          </span>
                          <SendHorizonal
                            className="relative mx-auto size-5 md:hidden"
                            strokeWidth={2}
                          />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Error messages */}
                    {errors.url && (
                      <p className="mt-2 text-sm text-red-600 text-left">
                        {errors.url.message}
                      </p>
                    )}
                    {error && (
                      <p className="mt-2 text-sm text-red-600 text-left">
                        {error}
                      </p>
                    )}
                  </form>

                  {/* <ul className="list-inside list-disc space-y-2">
                    <li>Faster</li>
                    <li>Modern</li>
                    <li>100% Customizable</li>
                  </ul> */}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 -mx-4 rounded-3xl p-3 lg:col-span-3">
              <div className="relative">
                <div className="bg-radial-[at_65%_25%] to-background z-1 -inset-17 absolute from-transparent to-40%"></div>
                <Image
                  className="hidden dark:block"
                  src="/music.png"
                  alt="app illustration"
                  width={2796}
                  height={2008}
                />
                <Image
                  className="dark:hidden"
                  src="/dashboard/clever-search-site-page-dark.png"
                  alt="app illustration"
                  width={2796}
                  height={2008}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
