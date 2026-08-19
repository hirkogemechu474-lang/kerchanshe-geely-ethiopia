/**
 * CORS helper for Web API routes.
 *
 * Web runs on a different host than admin:
 *   - WEB on GoDaddy (https://geelyethiopia.com) / localhost:3002
 *   - ADMIN on 192.168.1.20:3001 / localhost:3001
 *
 * Many pages in the public site submit form data (test-drive, quote, contact)
 * and when those forms use the admin API from a different origin the browser
 * requires valid CORS headers on both OPTIONS preflight and the actual POST.
 */

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://192.168.1.20:3001',
  'http://192.168.1.20:3002',
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
  if (origin.startsWith('http://127.0.0.1')) return true;
  return false;
}

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

export function corsPreflight(request: Request): NextResponse {
  const empty = new NextResponse(null, { status: 204 });
  return withCors(empty, request);
}

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
import { NextResponse } from 'next/server';
