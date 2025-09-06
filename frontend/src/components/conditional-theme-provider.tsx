"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useEffect } from "react";

interface ConditionalThemeProviderProps {
  children: React.ReactNode;
}

export function ConditionalThemeProvider({ children }: ConditionalThemeProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Immediately set the theme based on the current path
    const isDashboardPage = pathname.includes("/dashboard");
    
    if (!isDashboardPage) {
      // Force light theme for non-dashboard pages
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.remove("dashboard-page");
      document.documentElement.style.colorScheme = "light";
      document.documentElement.style.setProperty("--background", "0 0% 100%");
      document.documentElement.style.setProperty("--foreground", "222.2 84% 4.9%");
      document.documentElement.style.backgroundColor = "white";
    } else {
      // Add dashboard class for CSS targeting
      document.documentElement.classList.add("dashboard-page");
    }
  }, [pathname]);

  // Check if we're on dashboard pages
  const isDashboardPage = pathname.includes("/dashboard");

  if (isDashboardPage) {
    // Use normal theme provider for dashboard pages
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
        enableColorScheme
      >
        {children}
      </ThemeProvider>
    );
  }

  // Force light theme for all other pages (marketing, auth, etc.)
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="marketing-theme"
      forcedTheme="light"
    >
      {children}
    </ThemeProvider>
  );
}
