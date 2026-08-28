/**
 * PromotionRepository — server-only Prisma queries for promotions.
 */
import { prisma } from '@/lib/prisma';
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
};
