/**
 * SparePartRepository — server-only Prisma queries for spare parts.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const sparePartRepository = {
  async findAll() {
    return prisma.sparePart.findMany({
      orderBy: { createdAt: 'desc' },
      include: { partCategory: true },
    });
  },

  async findBySku(sku: string) {
    return prisma.sparePart.findUnique({ where: { sku } });
  },

  async findBySkuExcludingId(sku: string, excludeId: string) {
    return prisma.sparePart.findFirst({ where: { sku, NOT: { id: excludeId } } });
  },

  async create(data: Prisma.SparePartCreateInput) {
    return prisma.sparePart.create({ data, include: { partCategory: true } });
  },

  async update(id: string, data: Prisma.SparePartUpdateInput) {
    return prisma.sparePart.update({ where: { id }, data, include: { partCategory: true } });
  },

  async delete(id: string) {
    return prisma.sparePart.delete({ where: { id } });
  },

  // Powers the "Spare Parts" sidebar low-stock badge. stock/reorderPoint
  // are compared in application code — Prisma can't filter on a
  // column-vs-column comparison in a `where` clause.
  async findActiveStockLevels() {
    return prisma.sparePart.findMany({
      where: { isActive: true },
      select: { stock: true, reorderPoint: true },
    });
  },

  // FR-403: full rows for the workshop reorder-alerts panel — filtered and
  // sorted by urgency in application code for the same column-vs-column
  // reason as findActiveStockLevels above.
  async findAllActive() {
    return prisma.sparePart.findMany({ where: { isActive: true } });
  },
};
