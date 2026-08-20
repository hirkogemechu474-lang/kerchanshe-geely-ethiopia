import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { nextOrderNo } from '@/lib/sales/orderNumber';
import { PDI_CHECKLIST_TEMPLATE } from '@/lib/sales/pdiChecklistTemplate';
import type { OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as OrderStatus | null;

  const orders = await prisma.salesOrder.findMany({
    where: status ? { status } : undefined,
    include: {
      pdiItems: { select: { isChecked: true } },
      quotation: { select: { id: true } },
    },
    orderBy: { orderDate: 'desc' },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      vehicleModel: o.vehicleModel,
      totalPrice: o.totalPrice,
      financingStatus: o.financingStatus,
      status: o.status,
      orderDate: o.orderDate,
      quotationId: o.quotation?.id ?? null,
      pdiComplete: o.pdiItems.length > 0 && o.pdiItems.every((p) => p.isChecked),
      pdiProgress: `${o.pdiItems.filter((p) => p.isChecked).length}/${o.pdiItems.length}`,
    })),
  });
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

  const orderNo = await nextOrderNo();

  const order = await prisma.salesOrder.create({
    data: {
      orderNo,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      vehicleModel,
      totalPrice: totalPrice ? Number(totalPrice) : null,
      status: 'BOOKED',
      statusHistory: {
        create: { fromStatus: null, toStatus: 'BOOKED', changedById: session!.user.id },
      },
      pdiItems: {
        create: PDI_CHECKLIST_TEMPLATE.map((label) => ({ label })),
      },
    },
  });

  return NextResponse.json({ order }, { status: 201 });
}
