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
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// Field-level edits only (financing status, total price). Status
// transitions go through /status; PDI toggles go through /pdi.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { financingStatus, totalPrice, signedDocumentUrl } = body;

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
    },
  });

  return NextResponse.json({ order });
}
