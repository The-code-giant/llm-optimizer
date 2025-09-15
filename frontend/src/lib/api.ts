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
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteDetails extends Site {
  trackerId: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  siteId: string;
  url: string;
  title: string;
  llmReadinessScore: number; // Legacy field for compatibility
  lastScannedAt: string;
  lastAnalysisAt: string;
  createdAt: string;
  updatedAt: string;
  // New section-based ratings
  sectionRatings?: {
    title: number;        // 0-10 score
    description: number;  // 0-10 score
    headings: number;     // 0-10 score
    content: number;      // 0-10 score
    schema: number;       // 0-10 score
    images: number;       // 0-10 score
    links: number;        // 0-10 score
  };
}

// Utility function to calculate overall score from section ratings
export function calculateOverallScore(page: Page): number {
  if (page.sectionRatings) {
    const scores = Object.values(page.sectionRatings);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const maxPossible = scores.length * 10; // 7 sections * 10 = 70
    return Math.round((total / maxPossible) * 100); // Convert to percentage
  }
  // Fallback to legacy score
  return page.llmReadinessScore || 0;
}

export interface Recommendation {
  title: string;
  priority: string;
  description: string;
  expectedImpact: number;
  implementation: string;
}

export interface AnalysisResult {
  id: string;
  pageId: string;
  summary: string;
  issues: string[];
  recommendations: string[];
  score: number;
  createdAt: string;
  // New section-based ratings
  sectionRatings?: {
    title: number;        // 0-10 score
    description: number;  // 0-10 score
    headings: number;     // 0-10 score
    content: number;      // 0-10 score
    schema: number;       // 0-10 score
    images: number;       // 0-10 score
    links: number;        // 0-10 score
  };
  // New section-specific recommendations
  sectionRecommendations?: {
    title: Recommendation[];
    description: Recommendation[];
    headings: Recommendation[];
    content: Recommendation[];
    schema: Recommendation[];
    images: Recommendation[];
    links: Recommendation[];
  };
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

export interface DashboardMetrics {
  totalSites: number;
  avgLLMReadiness: number;
  totalPages: number;
  pagesWithScores: number;
  improvements: number;
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
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

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
  const response = await handleResponse(res);
  // Handle new paginated response format
  if (response.success && response.data && response.data.sites) {
    return response.data.sites;
  }
  // Fallback for direct array format (if any legacy endpoints still exist)
  return Array.isArray(response) ? response : [];
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

        // Calculate metrics using new scoring system
        const totalPages = pages.length;
        const pagesWithScores = pages.filter(
          (p) => p.sectionRatings || p.llmReadinessScore != null
        );
        const avgLLMReadiness =
          pagesWithScores.length > 0
            ? Math.round(
                pagesWithScores.reduce(
                  (sum, p) => sum + calculateOverallScore(p),
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
          (p) => calculateOverallScore(p) > 60
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
  const response = await handleResponse(res);
  
  // Handle new structured response format
  if (response.success && response.data) {
    return response.data;
  }
  
  // Fallback for direct response format (if any legacy endpoints still exist)
  return response;
}

export async function getSiteDetails(
  token: string,
  siteId: string
): Promise<SiteDetails> {
  const res = await fetch(`${API_BASE}/sites/${siteId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const response = await handleResponse(res);
  
  // Handle new structured response format
  if (response.success && response.data) {
    return response.data;
  }
  
  // Fallback for direct response format (if any legacy endpoints still exist)
  return response;
}

export async function deleteSite(
  token: string,
  siteId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/sites/${siteId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  
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
  
  // For DELETE requests, we don't expect a response body
  // Just check if the status is successful (204 No Content or 200 OK)
  if (res.status !== 204 && res.status !== 200) {
    throw new Error(`Unexpected status code: ${res.status}`);
  }
}

export interface GetPagesParams {
  search?: string;
  sortBy?: "title" | "url" | "score" | "lastScanned" | "createdAt";
  sortOrder?: "asc" | "desc";
  scoreFilter?: "all" | "high" | "medium" | "low";
  page?: number;
  limit?: number;
}

export interface GetPagesResponse {
  pages: Page[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getPages(
  token: string, 
  siteId: string, 
  params?: GetPagesParams
): Promise<GetPagesResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.search) searchParams.append('search', params.search);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  if (params?.scoreFilter && params.scoreFilter !== 'all') {
    searchParams.append('scoreFilter', params.scoreFilter);
  }
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const url = `${API_BASE}/sites/${siteId}/pages${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  
  const response = await handleResponse(res);
  
  // Handle new paginated response format
  if (response.success && response.data) {
    return {
      pages: response.data.pages || [],
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 10,
      totalPages: response.data.pagination?.pages || 1,
    };
  }
  
  // Fallback for legacy format
  const pages = Array.isArray(response) ? response : [];
  return {
    pages,
    total: pages.length,
    page: 1,
    limit: pages.length,
    totalPages: 1,
  };
}

export async function getPageDetails(
  token: string,
  pageId: string
): Promise<Page> {
  const res = await fetch(`${API_BASE}/pages/${pageId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const response = await handleResponse(res);
  
  // Handle new structured response format
  if (response.success && response.data) {
    return response.data;
  }
  
  // Fallback for direct response format (if any legacy endpoints still exist)
  return response;
}

export async function getPageAnalysis(
  token: string,
  pageId: string
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/analysis`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const response = await handleResponse(res);
  
  // Handle new structured response format
  if (response.success && response.data) {
    return response.data;
  }
  
  // Fallback for direct response format (if any legacy endpoints still exist)
  return response;
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
  const response = await fetch(`${API_BASE}/sites/${siteId}/sitemap/import`, {
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
  suggestions: unknown;
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
  
  const response = await handleResponse(res);
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as ContentSuggestion;
  }
  
  // Fallback for direct response format
  return response as ContentSuggestion;
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
  metadata: unknown;
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
  metadata?: unknown,
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
  
  const response = await handleResponse(res);
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as {
      message: string;
      pageId: string;
      contentType: string;
      deployedAt: string;
    };
  }
  
  // Fallback for direct response format
  return response as {
    message: string;
    pageId: string;
    contentType: string;
    deployedAt: string;
  };
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
  
  const response = await handleResponse(res);
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as {
      message: string;
      pageId: string;
      contentType: string;
    };
  }
  
  // Fallback for direct response format
  return response as {
    message: string;
    pageId: string;
    contentType: string;
  };
}

export interface DeployedContent {
  id: string;
  contentType: string;
  optimizedContent: string;
  version: number;
  deployedAt: string | null;
  deployedBy: string | null;
  metadata: unknown;
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
  
  const response = await handleResponse(res);
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as {
      pageId: string;
      pageUrl: string;
      deployedContent: DeployedContent[];
    };
  }
  
  // Fallback for direct response format
  return response as {
    pageId: string;
    pageUrl: string;
    deployedContent: DeployedContent[];
  };
}

export async function getPageContent(
  token: string,
  pageId: string,
  contentType?: "title" | "description" | "faq" | "paragraph" | "keywords" | "schema"
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
  const response = await handleResponse(res);
  
  // Handle new structured response format
  if (response.success && response.data) {
    return {
      pageId: response.data.pageId,
      content: response.data.content || []
    };
  }
  
  // Fallback for direct response format (if any legacy endpoints still exist)
  return {
    pageId: response.pageId || pageId,
    content: response.content || []
  };
}

export async function getCachedContentSuggestions(
  token: string,
  pageId: string,
  contentType?: "title" | "description" | "faq" | "paragraph" | "keywords"
): Promise<{ pageId: string; suggestions: unknown[] }> {
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
  
  const response = await handleResponse(res);
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as { pageId: string; suggestions: unknown[] };
  }
  
  // Fallback for direct response format
  return response as { pageId: string; suggestions: unknown[] };
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
    keywordAnalysis: unknown;
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
  content: unknown;
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
  
  const response = await handleResponse(res);
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as {
      message: string;
      content: unknown;
      contentSnapshot: string;
      refreshedAt: string;
    };
  }
  
  // Fallback for direct response format
  return response as {
    message: string;
    content: unknown;
    contentSnapshot: string;
    refreshedAt: string;
  };
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
  
  const response = await handleResponse(res);
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as {
      success: boolean;
      message: string;
      siteId?: string;
      redirectUrl?: string;
    };
  }
  
  // Fallback for direct response format
  return response as {
    success: boolean;
    message: string;
    siteId?: string;
    redirectUrl?: string;
  };
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
  isActive: boolean
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

export async function checkSubStatus(token: string): Promise<{
  isActive: boolean;
}> {
  const res = await fetch(`${API_BASE}/billing/check-sub-status`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

// Public tools: check bot accessibility for a URL
export interface BotAccessResult {
  agent: string;
  userAgent: string;
  robotsAllowed: boolean | 'unknown';
  httpStatus: number | null;
  ok: boolean;
  error?: string;
}

export async function checkBotAccessibility(url: string): Promise<{
  url: string;
  robotsTxtUrl: string;
  robotsTxtFound: boolean;
  results: BotAccessResult[];
}> {
  const res = await fetch(`${API_BASE}/tools/bot-access-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return handleResponse(res);
}

export async function submitToolLead(params: { email: string; phone?: string; website: string; source?: string }): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse(res);
}

// Section Ratings API
export async function getSectionRatings(token: string, pageId: string): Promise<{
  pageId: string;
  sectionRatings: {
    title: number;
    description: number;
    headings: number;
    content: number;
    schema: number;
    images: number;
    links: number;
  };
  sectionRecommendations: {
    title: Recommendation[];
    description: Recommendation[];
    headings: Recommendation[];
    content: Recommendation[];
    schema: Recommendation[];
    images: Recommendation[];
    links: Recommendation[];
  };
}> {
  const response = await fetch(`${API_BASE}/pages/${pageId}/section-ratings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch section ratings');
  }

  const result = await response.json();
  if (result && result.success && result.data) {
    return result.data;
  }
  return result;
}

export async function updateSectionRating(
  token: string, 
  pageId: string, 
  sectionType: string, 
  newScore: number, 
  deployedContent: string, 
  aiModel: string = 'gpt-4o-mini'
): Promise<{
  message: string;
  sectionType: string;
  previousScore: number;
  newScore: number;
  scoreImprovement: number;
}> {
  const response = await fetch(`${API_BASE}/pages/${pageId}/section-ratings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sectionType,
      newScore,
      deployedContent,
      aiModel,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update section rating');
  }

  return response.json();
}

export async function getSectionImprovements(
  token: string, 
  pageId: string, 
  sectionType: string
): Promise<{
  pageId: string;
  sectionType: string;
  improvements: Array<{
    id: string;
    previousScore: number;
    newScore: number;
    scoreImprovement: number;
    deployedContent: string;
    deployedAt: string;
  }>;
}> {
  const response = await fetch(`${API_BASE}/pages/${pageId}/section-improvements?sectionType=${sectionType}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch section improvements');
  }

  const data = await response.json();
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (data && data.success && data.data) {
    return data.data as {
      pageId: string;
      sectionType: string;
      improvements: Array<{
        id: string;
        previousScore: number;
        newScore: number;
        scoreImprovement: number;
        deployedContent: string;
        deployedAt: string;
      }>;
    };
  }
  
  // Fallback for direct response format
  return data as {
    pageId: string;
    sectionType: string;
    improvements: Array<{
      id: string;
      previousScore: number;
      newScore: number;
      scoreImprovement: number;
      deployedContent: string;
      deployedAt: string;
    }>;
  };
}

export async function generateSectionContent(
  token: string,
  pageId: string,
  sectionType: string,
  selectedRecommendations: string[],
  currentContent?: string,
  additionalContext?: string
): Promise<{
  success: boolean;
  data: {
    sectionType: string;
    generatedContent: {
      content: string;
      keyPoints: string[];
    };
    estimatedImprovement: number;
    recommendations: string[];
  };
}> {
  const response = await fetch(`${API_BASE}/pages/${pageId}/section-content`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sectionType,
      selectedRecommendations,
      currentContent,
      additionalContext,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate section content');
  }

  return response.json();
}

// Get dashboard metrics (optimized backend calculation)
export async function getDashboardMetrics(token: string): Promise<DashboardMetrics> {
  const response = await fetch(`${API_BASE}/users/dashboard-metrics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}

/**
 * Check if tracker script is installed on a site
 */
export async function checkTrackerInstallation(
  token: string,
  siteId: string
): Promise<{
  siteId: string;
  url: string;
  trackerId: string;
  isInstalled: boolean;
  checkedAt: string;
}> {
  const response = await fetch(`${API_BASE}/sites/${siteId}/check-tracker`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check tracker installation');
  }

  const result = await response.json();
  return result.data;
}

export async function submitEarlyAccessApplication(data: any): Promise<{ success: boolean, message: string }> {
  const res = await fetch(`${API_BASE}/early-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
