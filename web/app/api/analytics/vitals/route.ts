import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[analytics/vitals]', metric);
    }
  } catch {
    // sendBeacon payloads can't always be parsed as JSON; ignore malformed bodies
  }

  return NextResponse.json({ ok: true });
}
