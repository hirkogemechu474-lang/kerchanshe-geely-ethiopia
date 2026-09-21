import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

// Lets the admin app force the homepage's ISR cache (see app/page.tsx's
// `revalidate = 60`) to refresh immediately after a hero section is
// created/updated/deleted, instead of waiting up to ~60s + one stale
// request. Low-blast-radius on purpose (just re-runs the homepage's own
// data fetch a bit early) — the shared secret only deters casual abuse,
// not a strict security boundary.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/');
  return NextResponse.json({ revalidated: true });
}
