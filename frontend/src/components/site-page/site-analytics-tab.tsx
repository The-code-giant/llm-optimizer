"use client";

import TrackerAnalytics from "@/components/tracker-analytics";
import { SiteDetails } from "@/lib/api";

interface SiteAnalyticsTabProps {
  site: SiteDetails;
  siteId: string;
}

export function SiteAnalyticsTab({ site, siteId }: SiteAnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <TrackerAnalytics
        siteId={siteId}
        siteName={site.name}
      />
    </div>
  );
}
