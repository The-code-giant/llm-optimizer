# JWT Token Expiry Fix

## Problem
Your app was experiencing frequent JWT token expiry errors:
```
Auth error: _TokenVerificationError: JWT is expired. Expiry date: Thu, 04 Sep 2025 00:09:20 GMT, Current date: Thu, 04 Sep 2025 00:10:53 GMT.
```

This happened because:
1. Clerk issues short-lived JWTs for security (typically 60 seconds)
2. The polling requests in `AddSinglePageForm` could take 2+ minutes to complete
3. No automatic token refresh was implemented

## Solution Implemented

### 1. Token Manager (`frontend/src/lib/token-manager.ts`)
- **Automatic token refresh**: Detects when tokens are about to expire (30s buffer)
- **Token caching**: Avoids unnecessary refresh calls
- **JWT decoding**: Client-side expiry checking without verification
- **Enhanced error handling**: Parses `WWW-Authenticate` headers and JSON responses

### 2. Enhanced API Client (`frontend/src/lib/api-client.ts`)
- **Automatic retry**: Detects 401 with `token-expired` and automatically retries with fresh token
- **RFC-6750 support**: Reads standard `WWW-Authenticate` headers
- **Consistent interface**: Drop-in replacement for fetch with token handling

### 3. Enhanced API Functions (`frontend/src/lib/api-enhanced.ts`)
- **Type-safe wrappers**: Strongly typed functions for `addPage`, `triggerAnalysis`, `getPageAnalysis`
- **Automatic refresh**: All API calls now handle token expiry transparently

### 4. React Hook (`frontend/src/hooks/useEnhancedApi.ts`)
- **Clean interface**: Simple hook that provides enhanced API functions
- **Clerk integration**: Uses `useAuth().getToken` automatically

### 5. Backend Improvements (`backend/src/middleware/auth.ts`)
- **Enhanced 401 responses**: Now includes `WWW-Authenticate` headers and error reasons
- **Client detection**: Clients can detect `token-expired` vs other auth failures

## Key Features

### Automatic Token Refresh
```typescript
// Before: Manual token management
const token = await getToken();
const data = await fetch('/api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});

// After: Automatic refresh
const { getPageAnalysis } = useEnhancedApi();
const data = await getPageAnalysis(pageId); // Handles refresh automatically
```

### Smart Retry Logic
- Detects `token-expired` in response body or `WWW-Authenticate` header
- Automatically refreshes token and retries request once
- Fails gracefully if refresh doesn't work (user needs to re-authenticate)

### Long-Running Requests
The polling in `AddSinglePageForm` now:
- Refreshes tokens automatically during 2+ minute analysis waits
- Continues polling even if individual requests fail due to token expiry
- Shows appropriate error messages if authentication fails completely

## Testing

### 1. Verify Token Refresh
```typescript
import { TokenManager } from '@/lib/token-manager';

// Check token status
const token = await getToken();
TokenManager.logTokenStatus(token); // Logs expiry info

// Get fresh token
const freshToken = await TokenManager.getFreshToken(getToken);
```

### 2. Test API Calls
```typescript
import { useEnhancedApi } from '@/hooks/useEnhancedApi';

const { addPage, triggerAnalysis, getPageAnalysis } = useEnhancedApi();

// These will automatically handle token refresh
const page = await addPage(siteId, url);
await triggerAnalysis(page.id);
const analysis = await getPageAnalysis(page.id);
```

### 3. Monitor 401 Responses
Check browser network tab:
- First request: 401 with `WWW-Authenticate: Bearer error="token-expired"`
- Retry request: Should succeed with fresh token

## Files Modified

1. **Frontend**:
   - `frontend/src/lib/token-manager.ts` (new) - Core token management
   - `frontend/src/lib/api-client.ts` (new) - Enhanced API client
   - `frontend/src/lib/api-enhanced.ts` (new) - Type-safe API wrappers
   - `frontend/src/hooks/useEnhancedApi.ts` (new) - React hook
   - `frontend/src/components/AddSinglePageForm.tsx` (updated) - Uses new API

2. **Backend**:
   - `backend/src/middleware/auth.ts` (updated) - Enhanced 401 responses

## What Changed in User Experience

### Before
- Analysis polling would fail after ~60 seconds with cryptic 401 errors
- Users had to refresh the page and start over
- No clear indication why authentication failed

### After
- Analysis polling continues seamlessly for the full 2+ minutes
- Automatic token refresh happens transparently
- Clear error messages if authentication completely fails
- Graceful fallback: analysis continues even if some requests fail

## Next Steps

1. **Monitor logs**: Watch for token refresh events and 401 handling
2. **Apply to other components**: Update other components that make long-running API calls
3. **Consider session-based auth**: For even longer operations, consider server-side sessions
4. **Performance**: Monitor token cache hit rates and refresh frequency

## Configuration

The solution is configurable:

```typescript
// Token refresh timing
const BUFFER_TIME = 30; // seconds before expiry to refresh

// Polling configuration  
const POLLING_CONFIG = {
  timeoutMs: 120_000,    // 2 minutes
  initialDelay: 1000,    // 1 second
  maxDelay: 10_000,      // 10 seconds
};
```
