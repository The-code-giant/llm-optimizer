export interface Site {
  id: string;
  name: string;
  url: string;
  status: string;
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
  // Add more fields as needed
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

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
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function addSite(token: string, name: string, url: string): Promise<Site> {
  const res = await fetch(`${API_BASE}/sites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ name, url }),
  });
  return handleResponse(res);
}

export async function getSiteDetails(token: string, siteId: string): Promise<SiteDetails> {
  const res = await fetch(`${API_BASE}/sites/${siteId}`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getPages(token: string, siteId: string): Promise<Page[]> {
  const res = await fetch(`${API_BASE}/sites/${siteId}/pages`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getPageDetails(token: string, pageId: string): Promise<Page> {
  const res = await fetch(`${API_BASE}/pages/${pageId}`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getPageAnalysis(token: string, pageId: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/analysis`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function triggerAnalysis(token: string, pageId: string): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/analysis`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function importSitemap(token: string, siteId: string, sitemapUrl: string): Promise<void> {
  const response = await fetch(`${API_BASE}/sites/${siteId}/import-sitemap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ sitemapUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import sitemap');
  }
}

export async function addPage(token: string, siteId: string, url: string, title?: string): Promise<Page> {
  const response = await fetch(`${API_BASE}/sites/${siteId}/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ url, title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add page');
  }

  return response.json();
}

export async function getUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function updateUserProfile(token: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function addTeamMember(token: string, email: string): Promise<TeamMember> {
  const res = await fetch(`${API_BASE}/teams/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function getTeamMembers(token: string): Promise<TeamMember[]> {
  const res = await fetch(`${API_BASE}/teams/members`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getBillingInfo(token: string): Promise<BillingInfo> {
  const res = await fetch(`${API_BASE}/billing`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function updateBillingInfo(token: string, data: Partial<BillingInfo>): Promise<BillingInfo> {
  const res = await fetch(`${API_BASE}/billing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
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
  contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords',
  currentContent?: string,
  additionalContext?: string
): Promise<ContentSuggestion> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/content-suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentType,
      currentContent,
      additionalContext
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
  contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords',
  optimizedContent: string,
  originalContent?: string,
  generationContext?: string,
  metadata?: any
): Promise<{ message: string; content: PageContentData }> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentType,
      originalContent,
      optimizedContent,
      generationContext,
      metadata
    }),
  });
  return handleResponse(res);
}

export async function getPageContent(
  token: string,
  pageId: string,
  contentType?: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords'
): Promise<{ pageId: string; content: PageContentData[] }> {
  const url = new URL(`${API_BASE}/pages/${pageId}/content`);
  if (contentType) {
    url.searchParams.append('contentType', contentType);
  }
  
  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getCachedContentSuggestions(
  token: string,
  pageId: string,
  contentType?: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords'
): Promise<{ pageId: string; suggestions: any[] }> {
  const url = new URL(`${API_BASE}/pages/${pageId}/content-suggestions`);
  if (contentType) {
    url.searchParams.append('contentType', contentType);
  }
  
  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return handleResponse(res);
}

// Add more API functions as needed (sites, pages, etc.) 