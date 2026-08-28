/**
 * SalesOrderRepository — server-only Prisma queries for sales orders,
 * their PDI checklist items, and status history.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, OrderStatus } from '@prisma/client';

export const salesOrderRepository = {
  async create(data: Prisma.SalesOrderCreateInput) {
    return prisma.salesOrder.create({ data });
  },

  async findById(id: string) {
    return prisma.salesOrder.findUnique({ where: { id } });
  },

  async findByIdWithDetail(id: string) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: {
        pdiItems: { orderBy: { createdAt: 'asc' } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        quotation: { select: { id: true, message: true } },
        testDrives: { orderBy: { createdAt: 'desc' } },
      },
    });
  },

  async findByIdWithPdiItems(id: string) {
    return prisma.salesOrder.findUnique({ where: { id }, include: { pdiItems: true } });
  },

  // Fields needed to guard the PATCH route's price/commission edits.
  async findPatchGuardFields(id: string) {
    return prisma.salesOrder.findUnique({ where: { id }, select: { commissionStatus: true, approvedAt: true } });
  },

  // Status counts are computed across the WHOLE table (not just the current
  // filter/page) so the stat tiles stay accurate once the list itself is
  // paginated — otherwise "Booked: 3" would just mean "3 on this page".
  async findPage(where: Prisma.SalesOrderWhereInput | undefined, skip: number, take: number) {
    return Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          pdiItems: { select: { isChecked: true } },
          quotation: { select: { id: true } },
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take,
      }),
      prisma.salesOrder.count({ where }),
      prisma.salesOrder.groupBy({ by: ['status'], _count: true }),
    ]);
  },

  async update(id: string, data: Prisma.SalesOrderUpdateInput) {
    return prisma.salesOrder.update({ where: { id }, data });
  },

  async transitionStatus(
    id: string,
    orderData: Prisma.SalesOrderUpdateInput,
    historyData: { fromStatus: OrderStatus; toStatus: OrderStatus; changedById: string; reasonCode: string | null }
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.salesOrder.update({ where: { id }, data: orderData });
      await tx.salesOrderStatusHistory.create({ data: { orderId: id, ...historyData } });
      return result;
    });
  },

  async findPdiItem(itemId: string, orderId: string) {
    return prisma.pdiChecklistItem.findFirst({ where: { id: itemId, orderId } });
  },

  async updatePdiItem(itemId: string, data: Prisma.PdiChecklistItemUpdateInput) {
    return prisma.pdiChecklistItem.update({ where: { id: itemId }, data });
  },
};
