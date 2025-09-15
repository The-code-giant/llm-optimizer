"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Globe, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitWebsiteUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import ApplicationModal from "./early-access/application-modal";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

const urlSchema = z.object({
  url: z
    .string()
    .min(1, "Website URL is required")
    .transform((url) => {
      // Normalize URL by adding https:// if no protocol
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
      }
      return url;
    })
    .pipe(z.string().url("Please enter a valid website URL"))
    .refine((url) => {
      const urlObj = new URL(url);

      // Only allow HTTP/HTTPS protocols
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return false;
      }

      // Must have a valid hostname with at least one dot
      const hostname = urlObj.hostname;
      return hostname && hostname.includes(".") && hostname.length >= 3;
    }, "Please enter a valid website domain (e.g., example.com)")
    .refine((url) => {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check for valid domain characters (letters, numbers, hyphens, dots)
      const validDomainRegex =
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return validDomainRegex.test(hostname);
    }, "Please enter a valid website domain format"),
});

type UrlFormData = z.infer<typeof urlSchema>;

export default function HeroSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const words = [
    { text: "AI & SEO" },
    { text: "Visibility" },
    { text: "in", className: "text-blue-500 dark:text-blue-600" },
    { text: "Minutes", className: "text-blue-500 dark:text-blue-600" },
  ];
  // ["Boost Your Site&apos;s AI & SEO Visibility in Minutes", "Get Cited by ChatGPT, Claude, and Gemini", "Get More Traffic from AI-Powered Search"]
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (data: UrlFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Normalize URL (add https:// if not present)
      let normalizedUrl = data.url;
      if (
        !normalizedUrl.startsWith("http://") &&
        !normalizedUrl.startsWith("https://")
      ) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const result = await submitWebsiteUrl(normalizedUrl);

      if (result.success && result.redirectUrl) {
        // Navigate to signup with the website URL as a parameter
        router.push(result.redirectUrl);
      } else {
        setError(result.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to submit website URL. Please try again.");
      console.error("URL submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* <HeroHeader /> */}
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="absolute inset-0 -z-20"
            >
              <Image
                src="/dashboard/hero-sample.png"
                alt="Cleversearch admin panel"
                className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
                width={2796}
                height={2008}
              />

              {/* <Image
                  className="dark:hidden"
                  src="/dashboard/clever-search-site-page-dark.png"
                  alt="app illustration"
                  width={2796}
                  height={2008}
                /> */}
            </AnimatedGroup>
            <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"></div>
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mx-auto lg:mt-0 ">
                <AnimatedGroup variants={transitionVariants}>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mx-auto my-10 max-w-sm lg:my-12 lg:mx-auto"
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
                            {isSubmitting ? "Analyzing..." : "Analyze my site"}
                          </span>
                          <SendHorizonal
                            className="relative mx-auto size-5 md:hidden"
                            strokeWidth={2}
                          />
                        </Button>
                      </div>
                    </div>
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
                </AnimatedGroup>

                <h1 className="relative z-20 mx-auto max-w-4xl text-center text-xl font-normal text-black dark:text-white sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-tight leading-tight sm:leading-tight md:leading-tight lg:leading-tight xl:leading-tight">
                  {"Boost Your Site's AI & SEO "
                    .split(" ")
                    .map((word, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.1,
                          ease: "easeInOut",
                        }}
                        className="mr-2 inline-block"
                      >
                        {word}
                      </motion.span>
                    ))}
                  <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
                    <div className="absolute left-0 top-[1px] bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent bg-no-repeat py-2 sm:py-3 md:py-4 [text-shadow:0_0_rgba(0,0,0,0.1)] text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
                      <span className="">Visibility in Minutes.</span>
                    </div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent bg-no-repeat py-2 sm:py-3 md:py-4 text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
                      <span className="">Visibility in Minutes.</span>
                    </div>
                  </div>
                </h1>

                <motion.p
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: 0.8,
                  }}
                  className="relative z-20 mx-auto max-w-xl px-4 py-4 text-center text-base font-normal text-neutral-600 dark:text-neutral-300 sm:px-0 sm:text-lg"
                >
                  {
                    "Our AI-powered platform helps you optimize your website for Large Language Models (LLMs) and search engines, ensuring better visibility and citations."
                  }
                </motion.p>

                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: 1,
                  }}
                  className="relative z-20 mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4"
                >
                <ApplicationModal />
                  <Link
                    href="/demo"
                    className="w-full transform rounded-2xl border border-gray-300 bg-transparent px-6 py-3 text-sm font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800 sm:w-60 sm:py-2 sm:text-base md:text-lg"
                  >
                    {"Request a demo"}
                  </Link>
                </motion.div>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="bg-linear-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                />
                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-7xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                  {/* <Image
                    className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                    src="/mail2.png"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  /> */}

                  <Image
                    src="/dashboard/hero-sample.png"
                    alt="Cleversearch admin panel"
                    className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                    width={2700}
                    height={1440}
                  />
                  {/* <Image
                    className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                    src="/mail2-light.png"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  /> */}

                  <Image
                    src="/dashboard/hero-sample.png"
                    alt="Cleversearch admin panel"
                    className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                    width={2700}
                    height={1440}
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        <section className="bg-background">
          <div className="group relative m-auto max-w-7xl px-6">
            <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50" />
          </div>
        </section>
      </main>
    </>
  );
}
