import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TourProvider, TourOverlay } from "@/components/tours";
import { dashboardTour } from "@/components/tours/dashboard-tour";
import { siteDetailsTour } from "@/components/tours/site-details-tour";
import { analyticsTour } from "@/components/tours/analytics-tour";

async function checkSubscriptionStatus() {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return "/login"
    }

    // Make server-side API call to check subscription status
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/billing/check-sub-status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const subscriptionStatus = await response.json();
    
    if (!subscriptionStatus.isActive) {
      return "/dashboard/billing"
    }

    return ""
  } catch (error) {
    console.error("Error checking subscription status:", error);
     return ""
  }

}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check subscription status before rendering (billing page has its own layout)
  const redirectPath =await checkSubscriptionStatus();

  if(redirectPath){
    return redirect(redirectPath)
  }

  return (
    <TourProvider tours={[dashboardTour, siteDetailsTour, analyticsTour]}>
      {children}
      <TourOverlay />
    </TourProvider>
  );
}
