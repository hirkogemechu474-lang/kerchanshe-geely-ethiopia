import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - Fetch all quotations
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quotations });
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

  // UC-01 dedupe rule: "if the phone number matches an existing customer
  // record, the system links the new lead to that customer instead of
  // creating a duplicate." No Customer model exists for sales leads, so the
  // practical equivalent is: reuse an already-open (not converted/closed)
  // quotation for the same phone number rather than creating a second one.
  const existing = await prisma.quotation.findFirst({
    where: { phoneNumber, status: { notIn: ['converted', 'closed'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return NextResponse.json({ quotation: existing, deduped: true });
  }

  const quotation = await prisma.quotation.create({
    data: {
      customerName,
      phoneNumber,
      email: email || null,
      vehicleModel: vehicleModel || null,
      source: source || 'walk-in',
      message: message || null,
      status: 'new',
    },
  });

  return NextResponse.json({ quotation, deduped: false }, { status: 201 });
}
