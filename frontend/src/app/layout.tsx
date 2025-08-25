import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleTagManager, GoogleAnalytics  } from '@next/third-parties/google'

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
        className={`${poppins.variable} ${inter.variable} antialiased`}
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
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTIC_MANAGER_ID as string} />
            {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
