import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listQuotations, submitWalkInLead } from '@/lib/services/quotations/quotationService';

// GET - Paginated quotations, optionally filtered by status. Status counts
// are computed across the whole table (not just the current page/filter) so
// the tab counts stay accurate once the list itself is paginated.
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const search = searchParams.get('search') || undefined;

    const result = await listQuotations(status, page, search);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST - Log a walk-in / manually-captured lead (BRD FR-101, UC-01).
// Distinct from the public web/app/api/quotations/route.ts channel: a
// Sales Executive logging someone at the counter may only have a name and
// phone number yet (UC-01: "at minimum"), and no vehicle model if it's a
// general enquiry (UC-01 alt flow).
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { customerName, phoneNumber, email, vehicleModel, source, message } = body;

  if (!customerName || !phoneNumber) {
    return NextResponse.json({ error: 'customerName and phoneNumber are required' }, { status: 400 });
  }

  const { quotation, deduped } = await submitWalkInLead({ customerName, phoneNumber, email, vehicleModel, source, message });

  return NextResponse.json({ quotation, deduped }, { status: deduped ? 200 : 201 });
}
