import { Suspense } from "react";
import { DashboardLayout } from "../../components/ui/dashboard-layout";
import { DashboardClient } from "../../components/dashboard-client";

// This is now an async server component
export default async function DashboardPage() {
  // In a real implementation, you could fetch initial data here on the server
  // For now, we'll let the client component handle the data fetching
  
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      }>
        <DashboardClient />
      </Suspense>
    </DashboardLayout>
  );
} 