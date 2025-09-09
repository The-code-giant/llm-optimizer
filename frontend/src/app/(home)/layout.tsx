import { ThemeProvider } from "@/components/ui/theme-provider";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="home-theme"
      forcedTheme="light"
    >
      {children}
    </ThemeProvider>
  );
}
