import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listOrders, createOrder } from '@/lib/services/sales/orderListService';
import type { OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as OrderStatus | null;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const result = await listOrders(status, page);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { customerName, customerPhone, customerEmail, vehicleModel, totalPrice } = body;

  if (!customerName || !customerPhone || !vehicleModel) {
    return NextResponse.json({ error: 'customerName, customerPhone, and vehicleModel are required' }, { status: 400 });
  }

  const order = await createOrder({ customerName, customerPhone, customerEmail, vehicleModel, totalPrice }, session!.user.id);

  return NextResponse.json({ order }, { status: 201 });
}
