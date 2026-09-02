import { prisma } from '../config/database';
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

  async findActiveStockLevels() {
    return prisma.sparePart.findMany({
      where: { isActive: true },
      select: { stock: true, reorderPoint: true },
    });
  },

  async findAllActive() {
    return prisma.sparePart.findMany({ where: { isActive: true } });
  },

  async findMany(params?: { category?: string; search?: string; inStock?: boolean }) {
    const where: Prisma.SparePartWhereInput = { isActive: true };
    if (params?.category && params.category !== 'all') where.category = params.category;
    if (params?.search) {
      where.OR = [
        { sku: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.inStock) where.stock = { gt: 0 };

    return prisma.sparePart.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },
};
