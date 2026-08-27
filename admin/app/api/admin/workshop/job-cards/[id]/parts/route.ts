import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { requestJobCardPart, PartsIssueError } from '@/lib/services/workshop/partsIssue';

// FR-401/402 (UC-07): request a part against a job card. Reserves stock
// (SparePart.reservedQty) but does not touch on-hand stock — that happens at
// issue time via the [lineId] PATCH route.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: jobCardId } = await params;
  const body = await request.json();
  const { sparePartId, quantity, isWarranty } = body as {
    sparePartId: string;
    quantity: number;
    isWarranty?: boolean;
  };

  if (!sparePartId || !quantity) {
    return NextResponse.json({ error: 'sparePartId and quantity are required' }, { status: 400 });
  }

  const jobCard = await prisma.jobCard.findUnique({ where: { id: jobCardId } });
  if (!jobCard) {
    return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
  }

  try {
    const line = await prisma.$transaction((tx) =>
      requestJobCardPart(tx, {
        jobCardId,
        sparePartId,
        quantity: Number(quantity),
        isWarranty: Boolean(isWarranty),
        requestedById: session!.user.id,
      })
    );
    return NextResponse.json({ jobCardPart: line }, { status: 201 });
  } catch (error) {
    if (error instanceof PartsIssueError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error requesting job card part:', error);
    return NextResponse.json({ error: 'Failed to request part' }, { status: 500 });
  }
}
