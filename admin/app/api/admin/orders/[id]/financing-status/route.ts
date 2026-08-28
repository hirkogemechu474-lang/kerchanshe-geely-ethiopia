import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { transitionFinancingStatus } from '@/lib/services/sales/orderOpsService';
import type { FinancingStatus } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { toStatus } = body as { toStatus: FinancingStatus };

  if (!toStatus) {
    return NextResponse.json({ error: 'toStatus is required' }, { status: 400 });
  }

  const result = await transitionFinancingStatus(id, toStatus);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order });
}
