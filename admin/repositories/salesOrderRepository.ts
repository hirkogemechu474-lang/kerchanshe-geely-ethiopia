/**
 * SalesOrderRepository — server-only Prisma queries for sales orders.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const salesOrderRepository = {
  async create(data: Prisma.SalesOrderCreateInput) {
    return prisma.salesOrder.create({ data });
  },
};
