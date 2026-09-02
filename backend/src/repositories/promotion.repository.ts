import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const promotionRepository = {
  async findAll() {
    return prisma.promotion.findMany({
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { startDate: 'desc' }],
    });
  },

  async findById(id: string) {
    return prisma.promotion.findUnique({ where: { id } });
  },

  async create(data: Prisma.PromotionCreateInput) {
    return prisma.promotion.create({ data });
  },

  async update(id: string, data: Prisma.PromotionUpdateInput) {
    return prisma.promotion.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.promotion.delete({ where: { id } });
  },

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
};
