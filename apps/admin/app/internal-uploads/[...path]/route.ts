import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
// Never cached, in this process or the browser — see the note below on why
// this route exists at all instead of just letting Next serve /public/uploads.
export const dynamic = 'force-dynamic';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'public', 'uploads');

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// Files under public/uploads/ are written at runtime by staff/customer
// uploads (payment proofs, signed documents, staff signatures/stamps) long
// after this server started — they are not part of the build. Next's
// default /public static-file serving intermittently 404'd a just-uploaded
// file and kept 404ing it for that exact path until the server was
// restarted (observed with a payment-proof PDF uploaded mid-session), which
// looks like some layer of Next's production request handling caching that
// negative lookup rather than re-checking disk.
//
// This route lives at /internal-uploads (not /uploads) specifically so it
// can never collide with the public/uploads/ static folder — Next always
// prefers a public file over an app route at the same path, which would
// make this route dead code for every path that actually has a file. The
// public-facing URL stays /uploads/*: middleware.ts rewrites it to
// /internal-uploads/* before routing, so every request lands here and reads
// fresh from disk with no caching anywhere, instead of Next's static
// handler. (Not /_uploads — a leading underscore makes Next treat a folder
// as private and exclude it from routing entirely.)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  const resolved = path.resolve(UPLOADS_ROOT, ...segments);
  // Guard against path traversal (e.g. a segment of "..") escaping the
  // uploads directory.
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep) && resolved !== UPLOADS_ROOT) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }
    const body = fs.readFileSync(resolved);
    const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()] || 'application/octet-stream';
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
