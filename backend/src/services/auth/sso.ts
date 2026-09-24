import crypto from 'crypto';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { env } from '../../config/env';

// Kerchanshe SSO — OIDC relying-party helpers (Mode C in SSO-INTEGRATION-GUIDE:
// SSO is an additional way into the admin portal; the session it ends in is
// the same one the password login issues). See routes/sso.routes.ts.

const sso = env.sso;

export function isSsoConfigured(): boolean {
  return sso.enabled && !!sso.issuer && !!sso.internalUrl && !!sso.clientSecret && !!sso.redirectUri;
}

// createRemoteJWKSet caches keys and refetches once on an unknown `kid`, so
// a key rotation at the IdP needs no restart here.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(sso.jwksUri || `${sso.internalUrl}/jwks`));
  return jwks;
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export interface SsoFlow {
  state: string;
  nonce: string;
  codeVerifier: string;
}

export function startFlow(): { flow: SsoFlow; authorizeUrl: string } {
  const flow: SsoFlow = { state: randomToken(), nonce: randomToken(), codeVerifier: randomToken() };
  // PKCE on top of the client secret — not required for a confidential
  // client, but it costs nothing and closes authorization-code injection.
  const codeChallenge = crypto.createHash('sha256').update(flow.codeVerifier).digest('base64url');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: sso.clientId,
    redirect_uri: sso.redirectUri,
    scope: sso.scopes,
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return { flow, authorizeUrl: `${sso.issuer}/authorize?${params.toString()}` };
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<string> {
  const tokenRes = await fetch(`${sso.internalUrl}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: sso.redirectUri,
      client_id: sso.clientId,
      client_secret: sso.clientSecret,
      code_verifier: codeVerifier,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`SSO token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const body = (await tokenRes.json()) as { id_token?: string };
  if (!body.id_token) throw new Error('SSO token response had no id_token');
  return body.id_token;
}

/** Signature (RS256 via JWKS), `iss`, `aud` and `exp` — jose checks all four. */
export async function verifyIdToken(idToken: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: sso.issuer,
    audience: sso.clientId,
    algorithms: ['RS256'],
  });
  return payload;
}

const BACKCHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout';

/** Returns the logout token's `sub`, or null when the token isn't a valid logout token. */
export async function verifyLogoutToken(logoutToken: string): Promise<{ sub?: string } | null> {
  try {
    const { payload } = await jwtVerify(logoutToken, getJwks(), {
      issuer: sso.issuer,
      audience: sso.clientId,
      algorithms: ['RS256'],
    });
    const events = (payload.events ?? {}) as Record<string, unknown>;
    // Per OIDC Back-Channel Logout 1.0: the event must be present and a
    // nonce must NOT be — a nonce means this is an id_token being replayed
    // at the logout endpoint.
    if (!events[BACKCHANNEL_LOGOUT_EVENT] || 'nonce' in payload) return null;
    return { sub: typeof payload.sub === 'string' ? payload.sub : undefined };
  } catch {
    return null;
  }
}

/** RP-initiated logout at the IdP — ends the shared SSO session, not just Geely's. */
export function buildSsoLogoutUrl(): string | undefined {
  if (!isSsoConfigured()) return undefined;
  const params = new URLSearchParams({ client_id: sso.clientId });
  if (sso.postLogoutRedirectUri) params.set('post_logout_redirect_uri', sso.postLogoutRedirectUri);
  return `${sso.issuer}/session/end?${params.toString()}`;
}

export function adminHomeUrl(): string {
  return sso.adminHomeUrl || `${env.urls.admin.replace(/\/+$/, '')}/admin/analytics`;
}

export function adminLoginUrl(error?: string): string {
  const base = sso.adminLoginUrl || `${env.urls.admin.replace(/\/+$/, '')}/admin/login`;
  return error ? `${base}?error=${encodeURIComponent(error)}` : base;
}
