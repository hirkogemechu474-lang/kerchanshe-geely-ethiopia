import { NextResponse } from 'next/server';

/**
 * CORS helper for API routes.
 *
 * Both apps have different origins:
 *   - WEB on GoDaddy (https://geelyethiopia.com) or localhost:7501
 *   - ADMIN on 192.168.1.20:7500 or localhost:7500
 *
 * When the browser makes a cross-origin request (e.g. web form submits to
 * admin's /api/public/*, or admin panel reads public data endpoints)
 * we must return valid CORS headers otherwise the browser blocks it.
 */

const DEFAULT_ORIGINS = [
  'http://localhost:7500',
  'http://localhost:7501',
  'http://192.168.1.20:7500',
  'http://192.168.1.20:7501',
  'https://geelyethiopia.com',
  'https://www.geelyethiopia.com',
];

function getAllowedOrigins(): string[] {
  const env = process.env.CORS_ORIGINS;
  if (!env) return DEFAULT_ORIGINS;
  const fromEnv = env.split(',').map((s) => s.trim()).filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ORIGINS;
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return true;
  // Allow same-server LAN requests (no origin header from server-side fetches)
  if (origin.startsWith('http://127.0.0.1')) return true;
  return false;
}

/**
 * Apply CORS headers to a NextResponse. Pass this AFTER you build your response.
 *
 * For GET requests this is optional but good practice.
 * For POST/PUT/DELETE with non-simple headers you MUST handle the OPTIONS
 * preflight AND apply these headers to the actual response.
 */
export function withCors(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get('origin');
  const allowed = isOriginAllowed(origin);

  if (origin && allowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-middleware-check, x-api-key'
    );
    response.headers.set(
      'Access-Control-Expose-Headers',
      'Content-Length, Content-Type'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

/**
 * Shortcut for OPTIONS preflight responses in route handlers.
 *
 * Usage:
 *   export async function OPTIONS(req: Request) {
 *     return corsPreflight(req);
 *   }
 */
export function corsPreflight(request: Request): NextResponse {
  const empty = new NextResponse(null, { status: 204 });
  return withCors(empty, request);
}

/**
 * Wrap an API handler so that CORS headers are applied to the returned
 * NextResponse AND OPTIONS preflights are handled automatically.
 *
 * Usage:
 *   export const GET = withCorsHandler(async (req) => NextResponse.json({...}));
 */
export function withCorsHandler(
  handler: (request: Request, ctx?: any) => Promise<NextResponse> | NextResponse
) {
  return async function wrapped(request: Request, ctx?: any) {
    if (request.method === 'OPTIONS') {
      return corsPreflight(request);
    }
    const response = await handler(request, ctx);
    return withCors(response, request);
  };
}
