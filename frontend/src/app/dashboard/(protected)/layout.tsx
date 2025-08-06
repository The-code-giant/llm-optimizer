import { ThemeProvider } from "@/components/ui/theme-provider";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function checkSubscriptionStatus() {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    
    if (!token) {
     return redirect("/login");
    }

    // Make server-side API call to check subscription status
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/billing/check-sub-status`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const subscriptionStatus = await response.json();
    console.log(subscriptionStatus , '😂😂😂😂')
    if (!subscriptionStatus.isActive) {
     return redirect("/dashboard/billing");
    }

  } catch (error) {
    console.error("Error checking subscription status:", error);
    // If there's an error checking subscription, redirect to billing to be safe
    return redirect("/dashboard/billing");
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check subscription status before rendering (billing page has its own layout)
  await checkSubscriptionStatus();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
