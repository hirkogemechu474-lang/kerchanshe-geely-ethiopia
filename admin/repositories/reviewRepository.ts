/**
 * ReviewRepository — server-only Prisma queries for customer reviews.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const reviewRepository = {
  async findAll() {
    return prisma.review.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async findById(id: string) {
    return prisma.review.findUnique({ where: { id } });
  },

  async update(id: string, data: Prisma.ReviewUpdateInput) {
    return prisma.review.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.review.delete({ where: { id } });
  },
};
