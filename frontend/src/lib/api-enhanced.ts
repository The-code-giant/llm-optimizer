/**
 * Enhanced API functions with automatic token refresh
 * These are drop-in replacements for the original API functions
 */
import { GetTokenOptions } from "@clerk/types";
import { createApiClient } from "./api-client";
import type { Site, Page, AnalysisResult } from "./api";

/**
 * Enhanced addPage with automatic token refresh
 */
export async function addPageWithRetry(
  getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
  siteId: string,
  url: string
): Promise<Page> {
  const client = createApiClient(getTokenFn);
  const response = await client.post(`/sites/${siteId}/pages`, { url }) as any;
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as Page;
  }
  
  // Fallback for direct response format (if any legacy endpoints still exist)
  return response as Page;
}

/**
 * Enhanced triggerAnalysis with automatic token refresh
 */
export async function triggerAnalysisWithRetry(
  getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
  pageId: string
): Promise<void> {
  const client = createApiClient(getTokenFn);
  await client.post(`/pages/${pageId}/analysis`);
}

/**
 * Enhanced getPageAnalysis with automatic token refresh
 */
export async function getPageAnalysisWithRetry(
  getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
  pageId: string
): Promise<AnalysisResult> {
  const client = createApiClient(getTokenFn);
  const response = await client.get(`/pages/${pageId}/analysis`) as any;
  
  // Extract data from the response structure { success: true, data: {...}, message: "..." }
  if (response && response.success && response.data) {
    return response.data as AnalysisResult;
  }
  
  // Fallback for direct response format (if any legacy endpoints still exist)
  return response as AnalysisResult;
}

/**
 * Enhanced getSites with automatic token refresh
 */
export async function getSitesWithRetry(
  getTokenFn: (options?: GetTokenOptions) => Promise<string | null>
): Promise<Site[]> {
  const client = createApiClient(getTokenFn);
  return client.get('/sites') as Promise<Site[]>;
}

/**
 * Enhanced getPages with automatic token refresh
 */
export async function getPagesWithRetry(
  getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
  siteId: string
): Promise<Page[]> {
  const client = createApiClient(getTokenFn);
  return client.get(`/sites/${siteId}/pages`) as Promise<Page[]>;
}

/**
 * Enhanced deletePage with automatic token refresh
 */
export async function deletePageWithRetry(
  getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
  pageId: string
): Promise<void> {
  const client = createApiClient(getTokenFn);
  await client.delete(`/pages/${pageId}`);
}
