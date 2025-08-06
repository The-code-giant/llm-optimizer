import { AppSidebar } from "@/components/app-sidebar";
import { DashboardClient } from "@/components/dashboard-client";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TourTrigger } from "@/components/tours";
import { Suspense } from "react";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Suspense fallback={<div>Loading...</div>}>
                  <DashboardClient />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tour Trigger Button - Dashboard specific */}
        <div className="fixed bottom-4 right-4 z-50">
          <TourTrigger 
            tourId="dashboard" 
            className="shadow-xl bg-background/95 backdrop-blur-sm border-primary/30 hover:bg-background hover:border-primary/50 hover:shadow-2xl transition-all duration-200"
          >
            Start Tour
          </TourTrigger>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
