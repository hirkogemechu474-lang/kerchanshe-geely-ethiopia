import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { nextOrderNo } from '@/lib/services/sales/orderNumber';
import { PDI_CHECKLIST_TEMPLATE } from '@/lib/services/sales/pdiChecklistTemplate';
import type { OrderStatus } from '@prisma/client';

const PAGE_SIZE = 25;

// Status counts are computed across the WHOLE table (not just the current
// filter/page) so the stat tiles stay accurate once the list itself is
// paginated — otherwise "Booked: 3" would just mean "3 on this page".
export async function listOrders(status: OrderStatus | null, page: number, search?: string) {
  const trimmedSearch = search?.trim();
  const where = {
    ...(status && { status }),
    ...(trimmedSearch && {
      OR: [
        { orderNo: { contains: trimmedSearch, mode: 'insensitive' as const } },
        { customerName: { contains: trimmedSearch, mode: 'insensitive' as const } },
        { customerPhone: { contains: trimmedSearch, mode: 'insensitive' as const } },
        { vehicleModel: { contains: trimmedSearch, mode: 'insensitive' as const } },
      ],
    }),
  };
  const [orders, total, statusCounts] = await salesOrderRepository.findPage(where, (page - 1) * PAGE_SIZE, PAGE_SIZE);

  const countFor = (s: OrderStatus) => statusCounts.find((c) => c.status === s)?._count ?? 0;

  return {
    total,
    page,
    pageSize: PAGE_SIZE,
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
  };
}

export async function createOrder(
  input: { customerName: string; customerPhone: string; customerEmail?: string; vehicleModel: string; totalPrice?: number },
  createdById: string
) {
  const orderNo = await nextOrderNo();

  return salesOrderRepository.create({
    orderNo,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail || null,
    vehicleModel: input.vehicleModel,
    totalPrice: input.totalPrice ? Number(input.totalPrice) : null,
    status: 'BOOKED',
    statusHistory: {
      create: { fromStatus: null, toStatus: 'BOOKED', changedById: createdById },
    },
    pdiItems: {
      create: PDI_CHECKLIST_TEMPLATE.map((label) => ({ label })),
    },
  });
}
