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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
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
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
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
    const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()] || 'application/octet-stream';

    // Videos (hero background clips, 14-20MB+) need Range support: without
    // it, Safari refuses to play <video> at all, and Chrome/Firefox can't
    // seek — the whole file has to download before scrubbing works. Images/
    // PDFs are small enough that a plain full-file response (below) is fine.
    const range = req.headers.get('range');
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
        if (start < stat.size && end < stat.size && start <= end) {
          const chunk = fs.readFileSync(resolved).subarray(start, end + 1);
          return new NextResponse(chunk, {
            status: 206,
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(end - start + 1),
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'no-store',
            },
          });
        }
      }
    }

    const body = fs.readFileSync(resolved);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
