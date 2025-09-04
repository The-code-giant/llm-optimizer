/**
 * Enhanced API client with automatic token refresh and retry logic
 */
import { GetTokenOptions } from "@clerk/types";
import { fetchWithTokenRefresh, handleResponseWithAuth } from "./token-manager";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

/**
 * API wrapper that handles token refresh automatically
 */
export class ApiClient {
  private getTokenFn: (options?: GetTokenOptions) => Promise<string | null>;

  constructor(getTokenFn: (options?: GetTokenOptions) => Promise<string | null>) {
    this.getTokenFn = getTokenFn;
  }

  /**
   * Make an API request with automatic token refresh
   */
  async request(
    endpoint: string,
    options: RequestInit = {},
    tokenOptions?: GetTokenOptions
  ): Promise<unknown> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetchWithTokenRefresh(
      url,
      this.getTokenFn,
      {
        cache: "no-store",
        ...options,
      },
      tokenOptions
    );

    return handleResponseWithAuth(response);
  }

  /**
   * GET request
   */
  async get(endpoint: string, tokenOptions?: GetTokenOptions): Promise<unknown> {
    return this.request(endpoint, { method: "GET" }, tokenOptions);
  }

  /**
   * POST request
   */
  async post(
    endpoint: string,
    data?: unknown,
    tokenOptions?: GetTokenOptions
  ): Promise<unknown> {
    return this.request(
      endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : undefined,
      },
      tokenOptions
    );
  }

  /**
   * PUT request
   */
  async put(
    endpoint: string,
    data?: unknown,
    tokenOptions?: GetTokenOptions
  ): Promise<unknown> {
    return this.request(
      endpoint,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : undefined,
      },
      tokenOptions
    );
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string, tokenOptions?: GetTokenOptions): Promise<unknown> {
    return this.request(endpoint, { method: "DELETE" }, tokenOptions);
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(getTokenFn: (options?: GetTokenOptions) => Promise<string | null>) {
  return new ApiClient(getTokenFn);
}