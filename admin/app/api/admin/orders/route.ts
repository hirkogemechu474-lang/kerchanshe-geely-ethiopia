import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { nextOrderNo } from '@/lib/services/sales/orderNumber';
import { PDI_CHECKLIST_TEMPLATE } from '@/lib/services/sales/pdiChecklistTemplate';
import type { OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as OrderStatus | null;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = 25;
  const where = status ? { status } : undefined;

  // Status counts are computed across the WHOLE table (not just the current
  // filter/page) so the stat tiles stay accurate once the list itself is
  // paginated — otherwise "Booked: 3" would just mean "3 on this page".
  const [orders, total, statusCounts] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: {
        pdiItems: { select: { isChecked: true } },
        quotation: { select: { id: true } },
      },
      orderBy: { orderDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.salesOrder.count({ where }),
    prisma.salesOrder.groupBy({ by: ['status'], _count: true }),
  ]);

  const countFor = (s: OrderStatus) => statusCounts.find((c) => c.status === s)?._count ?? 0;

  return NextResponse.json({
    total,
    page,
    pageSize,
    stats: {
      total: statusCounts.reduce((sum, c) => sum + c._count, 0),
      booked: countFor('BOOKED'),
      readyForDelivery: countFor('READY_FOR_DELIVERY'),
      delivered: countFor('DELIVERED'),
    },
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
