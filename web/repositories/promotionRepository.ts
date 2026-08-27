/**
 * PromotionRepository — server-only Prisma queries for promotions.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const promotionRepository = {
  async findMany(status?: string) {
    const where: Prisma.PromotionWhereInput = { isActive: true };
    const now = new Date();
    if (status === 'active') {
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (status === 'upcoming') {
      where.startDate = { gt: now };
    } else if (status === 'expired') {
      where.endDate = { lt: now };
    }

    return prisma.promotion.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
  },

  async findActive() {
    const now = new Date();
    return prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async create(data: Prisma.PromotionCreateInput) {
    return prisma.promotion.create({ data });
  },
};
