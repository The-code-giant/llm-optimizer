import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ui/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
      title: "Clever Search – Boost Your Site for LLMs & Search",
  description:
    "AI-powered SEO platform to optimize your website for search engines and large language models. Import sitemaps, analyze pages, inject content, and track LLM readiness.",
  keywords:
    "AI SEO, LLM SEO, website optimization, sitemap import, content injection, search engine optimization, SaaS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#2563eb",
            },
          }}
          signInUrl="/login"
          signUpUrl="/register"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
         
            {children}
          
        </ClerkProvider>
      </body>
    </html>
  );
}
