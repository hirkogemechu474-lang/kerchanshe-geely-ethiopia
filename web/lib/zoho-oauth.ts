/**
 * Zoho CRM OAuth 2.0 Token Manager
 *
 * Handles automatic token refresh so the CRM integration never breaks
 * due to expired access tokens (Zoho tokens expire after 1 hour).
 *
 * Required env vars:
 *   ZOHO_CRM_CLIENT_ID       — Zoho API client ID
 *   ZOHO_CRM_CLIENT_SECRET   — Zoho API client secret
 *   ZOHO_CRM_REFRESH_TOKEN   — Long-lived refresh token (generated once via OAuth flow)
 *   ZOHO_CRM_ACCESS_TOKEN    — (optional) pre-existing access token for first request
 *   ZOHO_ACCOUNTS_URL        — Defaults to https://accounts.zoho.com
 */

interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix ms timestamp
}

// In-memory cache shared across requests in the same process
let tokenCache: TokenCache | null = null;

const ZOHO_ACCOUNTS_URL =
  process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';

// Refresh 5 minutes before actual expiry to avoid race conditions
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Returns a valid Zoho CRM access token, refreshing it if necessary.
 */
export async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();

  // 1. Return cached token if still valid
  if (tokenCache && tokenCache.expiresAt - EXPIRY_BUFFER_MS > now) {
    return tokenCache.accessToken;
  }

  // 2. Try to use static access token from env (first request optimization)
  const staticToken = process.env.ZOHO_CRM_ACCESS_TOKEN;
  const refreshToken = process.env.ZOHO_CRM_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CRM_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CRM_CLIENT_SECRET;

  // If we have a refresh token, always prefer that flow (keeps us fresh indefinitely)
  if (refreshToken && clientId && clientSecret) {
    return refreshAccessToken(refreshToken, clientId, clientSecret);
  }

  // Fallback: return static token (will break after 1 hour — not recommended for production)
  if (staticToken) {
    console.warn(
      '[zoho-oauth] Using static access token. Configure ZOHO_CRM_REFRESH_TOKEN for automatic refresh.'
    );
    tokenCache = {
      accessToken: staticToken,
      expiresAt: now + 55 * 60 * 1000, // Assume 55 min validity
    };
    return staticToken;
  }

  throw new Error(
    '[zoho-oauth] No Zoho credentials configured. Set ZOHO_CRM_REFRESH_TOKEN + ZOHO_CRM_CLIENT_ID + ZOHO_CRM_CLIENT_SECRET'
  );
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(
    `${ZOHO_ACCOUNTS_URL}/oauth/v2/token?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[zoho-oauth] Token refresh failed (${response.status}): ${text}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`[zoho-oauth] Token refresh returned no access_token: ${JSON.stringify(data)}`);
  }

  // Cache the new token
  const expiresInMs = (data.expires_in || 3600) * 1000;
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresInMs,
  };

  console.log(
    `[zoho-oauth] Token refreshed successfully. Expires in ${Math.round(expiresInMs / 60000)} minutes.`
  );

  return data.access_token;
}

/**
 * Clears the cached token (useful after a 401 response to force re-auth).
 */
export function invalidateZohoToken(): void {
  tokenCache = null;
}
