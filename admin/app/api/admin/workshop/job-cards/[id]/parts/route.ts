import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { requestPart } from '@/lib/services/workshop/jobCardPartsService';

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

  const result = await requestPart(jobCardId, { sparePartId, quantity, isWarranty }, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ jobCardPart: result.line }, { status: 201 });
}
