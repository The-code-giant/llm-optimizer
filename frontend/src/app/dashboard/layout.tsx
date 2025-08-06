import { ThemeProvider } from "@/components/ui/theme-provider";
import { TourProvider, TourOverlay } from "@/components/tours";
import { dashboardTour } from "@/components/tours/dashboard-tour";
import { siteDetailsTour } from "@/components/tours/site-details-tour";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TourProvider tours={[dashboardTour, siteDetailsTour]}>
        {children}
        <TourOverlay />
      </TourProvider>
    </ThemeProvider>
  );
}
