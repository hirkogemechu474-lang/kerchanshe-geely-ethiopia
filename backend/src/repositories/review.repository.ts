import { prisma } from '../config/database';
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

  async findApprovedActive(params?: { featured?: boolean; limit?: number }) {
    const where: Prisma.ReviewWhereInput = { status: 'approved', isActive: true };
    if (params?.featured) where.isFeatured = true;

    return prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit,
    });
  },

  async findApproved() {
    return prisma.review.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
  },
};
