import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleTagManager, GoogleAnalytics  } from '@next/third-parties/google'
import { ConditionalThemeProvider } from "@/components/conditional-theme-provider";

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
      title: "Cleversearch – Boost Your Site for LLMs & Search",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pathname = window.location.pathname;
                  var isDashboard = pathname.includes('/dashboard');
                  
                  if (!isDashboard) {
                    // Force light theme for non-dashboard pages
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.remove('dashboard-page');
                    document.documentElement.style.colorScheme = 'light';
                    document.documentElement.style.setProperty('--background', '0 0% 100%');
                    document.documentElement.style.setProperty('--foreground', '222.2 84% 4.9%');
                    document.documentElement.style.backgroundColor = 'white';
                  } else {
                    // Add dashboard class for CSS targeting
                    document.documentElement.classList.add('dashboard-page');
                    // For dashboard pages, use normal theme detection
                    var theme = localStorage.getItem('theme');
                    var isDark = theme === 'dark' || 
                      (theme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.style.colorScheme = 'dark';
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.style.colorScheme = 'light';
                    }
                  }
                } catch (e) {
                  // Fallback to light theme
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                  document.documentElement.style.backgroundColor = 'white';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${inter.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#2563eb",
            },
            elements: {
              rootBox: "dark:bg-gray-900",
              card: "dark:bg-gray-800",
            },
          }}
          signInUrl="/login"
          signUpUrl="/register"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <ConditionalThemeProvider>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTIC_MANAGER_ID as string} />
            {children}
          </ConditionalThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
