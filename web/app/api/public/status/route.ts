import { NextRequest, NextResponse } from 'next/server';
import { lookupStatus } from '@/lib/services/status/statusLookupService';

// GET /api/public/status?ref=GY-SQ-DDMMYYYY-NNN
// Looks up a customer-facing reference across every flow that issues one,
// so a single "check your status" page can serve quotes, purchases,
// service bookings, financing applications, parts requests, and test drives.
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')?.trim();
  if (!ref) {
    return NextResponse.json({ found: false, error: 'A reference number is required.' }, { status: 400 });
  }

  const result = await lookupStatus(ref);

  if (!result) {
    return NextResponse.json({ found: false, error: 'No request found for that reference number.' }, { status: 404 });
  }

  return NextResponse.json({ found: true, result });
}
