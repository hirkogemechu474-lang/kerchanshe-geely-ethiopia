import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { UPLOADS_ROOT, isInsideUploads } from '@/lib/upload-utils';

// Fallback for /uploads/* requests that Next's own static `public/` serving
// didn't resolve. Next.js only serves NEW files under public/uploads at
// build time in production mode (next build && next start) — anything
// written there afterward (signed quotations/agreements/handovers, payment
// proofs, staff signatures — all written at runtime, well after any build)
// 404s until the app is rebuilt. This route reads straight from disk on
// every request instead, so uploads work immediately in both dev and
// production without a rebuild. Existing files already served by the
// static handler are unaffected (Next only reaches this route when its own
// static resolution comes up empty), and the public URL shape
// (/uploads/...) stays exactly the same either way.
const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filePath = path.join(UPLOADS_ROOT, ...segments);

  if (!isInsideUploads(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) throw new Error('Not a file');

    const bytes = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
        'Content-Length': String(stats.size),
        // Uploaded filenames already embed a timestamp, so the same URL
        // never changes content — safe to cache aggressively.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    // Not on this server (e.g. a catalog/CMS asset that only lives on the
    // admin app) — fall back the same way the old rewrite did.
    const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:7500').replace(/\/$/, '');
    return NextResponse.redirect(`${adminUrl}/uploads/${segments.map(encodeURIComponent).join('/')}`, 302);
  }
}
