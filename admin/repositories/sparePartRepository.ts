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
};
