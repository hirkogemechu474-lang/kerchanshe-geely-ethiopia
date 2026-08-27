/**
 * PartRepository — server-only Prisma queries for spare parts.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const partRepository = {
  async findMany(params?: { category?: string; search?: string; inStock?: boolean }) {
    const where: Prisma.SparePartWhereInput = { isActive: true };
    if (params?.category && params.category !== 'all') where.category = params.category;
    if (params?.search) {
      where.OR = [
        { partNumber: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.inStock) where.stock = { gt: 0 };

    return prisma.sparePart.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.SparePartCreateInput) {
    return prisma.sparePart.create({ data });
  },
};
