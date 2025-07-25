export interface Site {
  id: string;
  name: string;
  url: string;
  status: string;
}

export interface SiteWithMetrics extends Site {
  trackerId: string;
  lastScan?: string;
  llmReadiness?: number;
  pagesScanned?: number;
  totalPages?: number;
  improvements?: number;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteDetails extends Site {
  trackerId: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  siteId: string;
  url: string;
  title: string;
  llmReadinessScore: number;
  lastScannedAt: string;
  lastAnalysisAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResult {
  id: string;
  pageId: string;
  summary: string;
  issues: string[];
  recommendations: string[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    dashboardView?: "grid" | "list";
    emailNotifications?: boolean;
    autoAnalysis?: boolean;
  };
  statistics?: {
    sitesCount: number;
    pagesCount: number;
    deploymentsCount: number;
    analysisCount: number;
    recentActivity: Array<{
      id: string;
      type: string;
      pageUrl: string;
      siteName: string;
      timestamp: string;
    }>;
  };
}

export interface TeamMember {
  id: string;
  email: string;
  name?: string;
  role: string;
  invitedAt: string;
  status: string;
}

export interface BillingInfo {
  plan: string;
  status: string;
  renewalDate: string;
  paymentMethod: string;
  amount: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

async function handleResponse(res: Response) {
  if (!res.ok) {
    let message = "Unknown error";
    try {
      const data = await res.json();
      message = data.message || JSON.stringify(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        message = err.message;
      }
    }
    throw new Error(message);
  }
  return res.json();
}

export async function getSites(token: string): Promise<Site[]> {
  const res = await fetch(`${API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getSitesWithMetrics(
  token: string
): Promise<SiteWithMetrics[]> {
  const sites = await getSites(token);

  // Enrich each site with metrics
  const sitesWithMetrics = await Promise.all(
    sites.map(async (site) => {
      try {
        // Get site details to get trackerId
        const siteDetails = await getSiteDetails(token, site.id);

        // Get pages for this site
        const pages = await getPages(token, site.id);

        // Calculate metrics
        const totalPages = pages.length;
        const pagesWithScores = pages.filter(
          (p) => p.llmReadinessScore != null
        );
        const avgLLMReadiness =
          pagesWithScores.length > 0
            ? Math.round(
                pagesWithScores.reduce(
                  (sum, p) => sum + (p.llmReadinessScore || 0),
                  0
                ) / pagesWithScores.length
              )
            : 0;

        // Find most recent scan
        const pagesWithScans = pages.filter((p) => p.lastScannedAt);
        const lastScan =
          pagesWithScans.length > 0
            ? pagesWithScans.sort(
                (a, b) =>
                  new Date(b.lastScannedAt).getTime() -
                  new Date(a.lastScannedAt).getTime()
              )[0].lastScannedAt
            : null;

        // Format last scan time
        const formattedLastScan = lastScan
          ? formatRelativeTime(new Date(lastScan))
          : "Never scanned";

        // Count improvements (pages with score > 60 as improvement indicator)
        const improvements = pagesWithScores.filter(
          (p) => (p.llmReadinessScore || 0) > 60
        ).length;

        return {
          ...site,
          trackerId: siteDetails.trackerId,
          lastScan: formattedLastScan,
          llmReadiness: avgLLMReadiness,
          pagesScanned: pagesWithScans.length,
          totalPages,
          improvements,
          settings: siteDetails.settings,
          createdAt: siteDetails.createdAt,
          updatedAt: siteDetails.updatedAt,
        } as SiteWithMetrics;
      } catch (error) {
        console.error(`Failed to load metrics for site ${site.id}:`, error);
        // Return site with default metrics if API calls fail
        return {
          ...site,
          trackerId: "",
          lastScan: "Error loading",
          llmReadiness: 0,
          pagesScanned: 0,
          totalPages: 0,
          improvements: 0,
        } as SiteWithMetrics;
      }
    })
  );

  return sitesWithMetrics;
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
}

export async function addSite(
  token: string,
  name: string,
  url: string
): Promise<Site> {
  const res = await fetch(`${API_BASE}/sites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, url }),
  });
  return handleResponse(res);
}

export async function getSiteDetails(
  token: string,
  siteId: string
): Promise<SiteDetails> {
  const res = await fetch(`${API_BASE}/sites/${siteId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getPages(token: string, siteId: string): Promise<Page[]> {
  const res = await fetch(`${API_BASE}/sites/${siteId}/pages`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getPageDetails(
  token: string,
  pageId: string
): Promise<Page> {
  const res = await fetch(`${API_BASE}/pages/${pageId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getPageAnalysis(
  token: string,
  pageId: string
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/analysis`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function triggerAnalysis(
  token: string,
  pageId: string
): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/analysis`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function importSitemap(
  token: string,
  siteId: string,
  sitemapUrl: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/sites/${siteId}/import-sitemap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sitemapUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to import sitemap");
  }
}

export async function addPage(
  token: string,
  siteId: string,
  url: string,
  title?: string
): Promise<Page> {
  const response = await fetch(`${API_BASE}/sites/${siteId}/pages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url, title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add page");
  }

  return response.json();
}

export interface DeletePageResult {
  message: string;
  deletedPageId: string;
  deletedRelatedData: {
    analysisResults: number;
    pageInjectedContent: number;
    pageContent: number;
    contentSuggestions: number;
    pageAnalytics: number;
  };
}

export async function deletePage(
  token: string,
  pageId: string
): Promise<DeletePageResult> {
  const response = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete page");
  }

  return response.json();
}

export async function deletePages(
  token: string,
  pageIds: string[]
): Promise<DeletePageResult[]> {
  const results = await Promise.all(
    pageIds.map((pageId) => deletePage(token, pageId))
  );
  return results;
}

export async function getUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function updateUserProfile(
  token: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function addTeamMember(
  token: string,
  email: string
): Promise<TeamMember> {
  const res = await fetch(`${API_BASE}/teams/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function getTeamMembers(token: string): Promise<TeamMember[]> {
  const res = await fetch(`${API_BASE}/teams/members`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getBillingInfo(token: string): Promise<BillingInfo> {
  const res = await fetch(`${API_BASE}/billing`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function updateBillingInfo(
  token: string,
  data: Partial<BillingInfo>
): Promise<BillingInfo> {
  const res = await fetch(`${API_BASE}/billing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export interface ContentSuggestion {
  contentType: string;
  suggestions: any;
  pageUrl: string;
  generatedAt: string;
}

export async function generateContentSuggestions(
  token: string,
  pageId: string,
  contentType: "title" | "description" | "faq" | "paragraph" | "keywords",
  currentContent?: string,
  additionalContext?: string
): Promise<ContentSuggestion> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/content-suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentType,
      currentContent,
      additionalContext,
    }),
  });
  return handleResponse(res);
}

export interface PageContentData {
  id: string;
  pageId: string;
  contentType: string;
  originalContent?: string;
  optimizedContent: string;
  aiModel?: string;
  generationContext?: string;
  isActive: number;
  version: number;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export async function savePageContent(
  token: string,
  pageId: string,
  contentType:
    | "title"
    | "description"
    | "faq"
    | "paragraph"
    | "keywords"
    | "schema",
  optimizedContent: string,
  originalContent?: string,
  generationContext?: string,
  metadata?: any,
  deployImmediately: boolean = false
): Promise<{ message: string; content: PageContentData; deployed: boolean }> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentType,
      optimizedContent,
      originalContent,
      generationContext,
      metadata,
      deployImmediately,
    }),
  });
  return handleResponse(res);
}

// Deploy specific content type for a page
export async function deployPageContent(
  token: string,
  pageId: string,
  contentType:
    | "title"
    | "description"
    | "faq"
    | "paragraph"
    | "keywords"
    | "schema"
): Promise<{
  message: string;
  pageId: string;
  contentType: string;
  deployedAt: string;
}> {
  const res = await fetch(
    `${API_BASE}/pages/${pageId}/content/${contentType}/deploy`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse(res);
}

// Undeploy specific content type for a page
export async function undeployPageContent(
  token: string,
  pageId: string,
  contentType:
    | "title"
    | "description"
    | "faq"
    | "paragraph"
    | "keywords"
    | "schema"
): Promise<{ message: string; pageId: string; contentType: string }> {
  const res = await fetch(
    `${API_BASE}/pages/${pageId}/content/${contentType}/undeploy`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse(res);
}

export interface DeployedContent {
  id: string;
  contentType: string;
  optimizedContent: string;
  version: number;
  deployedAt: string | null;
  deployedBy: string | null;
  metadata: any;
}

// Get all deployed content for a page
export async function getDeployedPageContent(
  token: string,
  pageId: string
): Promise<{
  pageId: string;
  pageUrl: string;
  deployedContent: DeployedContent[];
}> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/deployed-content`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getPageContent(
  token: string,
  pageId: string,
  contentType?: "title" | "description" | "faq" | "paragraph" | "keywords"
): Promise<{ pageId: string; content: PageContentData[] }> {
  const url = new URL(`${API_BASE}/pages/${pageId}/content`);
  if (contentType) {
    url.searchParams.append("contentType", contentType);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getCachedContentSuggestions(
  token: string,
  pageId: string,
  contentType?: "title" | "description" | "faq" | "paragraph" | "keywords"
): Promise<{ pageId: string; suggestions: any[] }> {
  const url = new URL(`${API_BASE}/pages/${pageId}/content-suggestions`);
  if (contentType) {
    url.searchParams.append("contentType", contentType);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return handleResponse(res);
}

export interface OriginalPageContent {
  pageId: string;
  pageUrl: string;
  originalContent: {
    title: string;
    metaDescription: string;
    headings: string[];
    bodyText: string;
    images: number;
    links: number;
  };
  pageSummary: string | null;
  analysisContext: {
    score: number;
    summary: string;
    keywordAnalysis: any;
    issues: string[];
    recommendations: string[];
    lastAnalyzedAt: string;
  } | null;
  needsAnalysis: boolean;
}

export async function getOriginalPageContent(
  token: string,
  pageId: string
): Promise<OriginalPageContent> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/original-content`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

// Refresh page content from live URL
export async function refreshPageContent(
  token: string,
  pageId: string
): Promise<{
  message: string;
  content: any;
  contentSnapshot: string;
  refreshedAt: string;
}> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/refresh-content`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return handleResponse(res);
}

// Add more API functions as needed (sites, pages, etc.)

// Submit website URL for analysis (pre-signup)
export async function submitWebsiteUrl(url: string): Promise<{
  success: boolean;
  message: string;
  siteId?: string;
  redirectUrl?: string;
}> {
  const res = await fetch(`${API_BASE}/sites/pre-submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
  return handleResponse(res);
}

export async function updateProfileName(
  token: string,
  name: string
): Promise<{
  success: boolean;
  message: string;
  siteId?: string;
  redirectUrl?: string;
}> {
  const res = await fetch(`${API_BASE}/users/profile-clerk`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function getActiveSubscription(token: string): Promise<{
  type: string;
  nextBilling: string;
}> {
  const res = await fetch(`${API_BASE}/billing`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function changePlan(token: string, type: string) {
  const res = await fetch(`${API_BASE}/billing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type }),
  });
  return handleResponse(res);
}
