import { GetTokenOptions } from "@clerk/types";

// JWT payload interface for decoding
interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: unknown;
}

/**
 * Utility class for handling JWT token refresh and validation
 */
export class TokenManager {
  private static tokenCache: string | null = null;
  private static tokenExpiry: number | null = null;
  private static refreshPromise: Promise<string> | null = null;

  /**
   * Decode JWT payload without verification (client-side only)
   */
  private static decodeJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.warn('Failed to decode JWT:', error);
      return null;
    }
  }

  /**
   * Check if token is expired or will expire soon (30 seconds buffer)
   */
  private static isTokenExpired(token: string): boolean {
    const payload = this.decodeJWT(token);
    if (!payload?.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 30; // 30 seconds buffer
    return now >= (payload.exp - bufferTime);
  }

  /**
   * Get a fresh token, with automatic refresh if expired
   */
  static async getFreshToken(
    getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
    options?: GetTokenOptions
  ): Promise<string> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check cached token first
    if (this.tokenCache && this.tokenExpiry) {
      const now = Math.floor(Date.now() / 1000);
      if (now < this.tokenExpiry - 30) { // 30 second buffer
        return this.tokenCache;
      }
    }

    // Need to refresh token
    this.refreshPromise = this.refreshToken(getTokenFn, options);
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Refresh token and update cache
   */
  private static async refreshToken(
    getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
    options?: GetTokenOptions
  ): Promise<string> {
    
    const token = await getTokenFn(options);
    if (!token) {
      throw new Error('Failed to get token from Clerk');
    }

    // Update cache
    const payload = this.decodeJWT(token);
    this.tokenCache = token;
    this.tokenExpiry = payload?.exp || null;

    return token;
  }

  /**
   * Clear token cache (useful for logout)
   */
  static clearCache(): void {
    this.tokenCache = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
  }

  /**
   * Check if a token is expired and log details
   */
  static logTokenStatus(token: string): void {
    const payload = this.decodeJWT(token);
    if (!payload?.exp) {
      console.warn('⚠️ Invalid token - no expiry claim');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = payload.exp - now;

    
    if (secondsUntilExpiry <= 0) {
      console.warn('❌ Token is expired!');
    } else if (secondsUntilExpiry <= 60) {
      console.warn(`⚠️ Token expires soon: ${secondsUntilExpiry} seconds`);
    } else {
    }
  }
}

/**
 * Enhanced fetch wrapper that handles token refresh and retry on 401
 */
export async function fetchWithTokenRefresh(
  url: string,
  getTokenFn: (options?: GetTokenOptions) => Promise<string | null>,
  options: RequestInit = {},
  tokenOptions?: GetTokenOptions
): Promise<Response> {
  // Get fresh token
  let token = await TokenManager.getFreshToken(getTokenFn, tokenOptions);
  
  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Make the request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get 401, check if it's a token expiry and retry once
  if (response.status === 401) {
    try {
      const errorData = await response.clone().json();
      const wwwAuth = response.headers.get('WWW-Authenticate');
      
      // Check if it's a token expiry error
      const isTokenExpired = 
        errorData.reason === 'token-expired' || 
        wwwAuth?.includes('error="token-expired"') ||
        wwwAuth?.includes('JWT is expired');

      if (isTokenExpired) {
        
        // Clear cache and get a fresh token
        TokenManager.clearCache();
        token = await TokenManager.getFreshToken(getTokenFn, tokenOptions);
        
        // Retry the request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          console.error('❌ Still getting 401 after token refresh - may need to re-authenticate');
        } else {
        }
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse 401 error response:', parseError);
    }
  }

  return response;
}

/**
 * Enhanced handleResponse that provides better error messages for auth failures
 */
export async function handleResponseWithAuth(res: Response): Promise<unknown> {
  if (!res.ok) {
    let message = "Unknown error";
    let isAuthError = false;
    
    try {
      const data = await res.json();
      message = data.message || JSON.stringify(data);
      
      if (res.status === 401) {
        isAuthError = true;
        const reason = data.reason || 'unknown';
        const wwwAuth = res.headers.get('WWW-Authenticate');
        
        if (reason === 'token-expired' || wwwAuth?.includes('token-expired')) {
          message = 'Your session has expired. Please sign in again.';
        } else {
          message = 'Authentication failed. Please sign in again.';
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        message = err.message;
      }
    }
    
    const error = new Error(message) as Error & { status?: number; isAuthError?: boolean };
    error.status = res.status;
    error.isAuthError = isAuthError;
    throw error;
  }
  return res.json();
}
