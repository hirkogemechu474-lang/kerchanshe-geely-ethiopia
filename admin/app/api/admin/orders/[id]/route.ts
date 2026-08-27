import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      pdiItems: { orderBy: { createdAt: 'asc' } },
      statusHistory: { orderBy: { changedAt: 'asc' } },
      quotation: { select: { id: true, message: true } },
      testDrives: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// Field-level edits only (financing status, total price, registration,
// commission assignment). Status transitions go through /status; PDI
// toggles go through /pdi; invoice generation and approval go through
// their own dedicated one-way action routes (.../invoice, .../approve).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { financingStatus, totalPrice, signedDocumentUrl, registrationNumber, salesAgentId, commissionRate } = body;

  // Fetched first so editing salesAgentId doesn't clobber a commission
  // that's already EARNED/PAID — that already happened as a consequence
  // of delivery and an edit here afterward shouldn't erase the record.
  // Also covers the totalPrice guard below (need approvedAt either way).
  const existing = (salesAgentId !== undefined || totalPrice !== undefined)
    ? await prisma.salesOrder.findUnique({ where: { id }, select: { commissionStatus: true, approvedAt: true } })
    : null;

  if (totalPrice !== undefined && existing?.approvedAt) {
    return NextResponse.json({ error: 'Price cannot be changed after the order has been approved.' }, { status: 409 });
  }

  try {
    const order = await prisma.salesOrder.update({
      where: { id },
      data: {
        ...(financingStatus !== undefined && { financingStatus }),
        ...(totalPrice !== undefined && { totalPrice: totalPrice === null ? null : Number(totalPrice) }),
        // Staff-attached photo/scan of the physically-signed sales agreement
        // (BRD-adjacent "e-sign or attach" step) — reuses the same
        // upload-then-PATCH convention as TestDrive.idPhotoUrl.
        ...(signedDocumentUrl !== undefined && {
          signedDocumentUrl,
          signedAt: signedDocumentUrl ? new Date() : null,
        }),
        // Vehicle registration — a plain field edit (unlike approval/signing,
        // a mistyped plate number is just a correction, not a business event
        // that needs a one-way gate).
        ...(registrationNumber !== undefined && {
          registrationNumber,
          registeredAt: registrationNumber ? new Date() : null,
          registeredById: registrationNumber ? session!.user.id : null,
        }),
        // Commission assignment — salesAgentId is free text, matching
        // Quotation.assignedTo's existing convention (no user-picker UI).
        ...(salesAgentId !== undefined && {
          salesAgentId,
          ...(existing?.commissionStatus !== 'EARNED' && existing?.commissionStatus !== 'PAID' && {
            commissionStatus: salesAgentId ? 'PENDING' : 'NOT_APPLICABLE',
          }),
        }),
        ...(commissionRate !== undefined && { commissionRate: commissionRate === null ? null : Number(commissionRate) }),
      },
    });

    return NextResponse.json({ order });
  } catch (dbError) {
    console.error('[orders:patch]', dbError);
    return NextResponse.json({ error: 'Update failed. Please try again.' }, { status: 500 });
  }
}
