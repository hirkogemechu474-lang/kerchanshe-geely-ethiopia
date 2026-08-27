/**
 * ReviewRepository — server-only Prisma queries for customer reviews
 * (also serves the public "testimonials" surface, same underlying model).
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const reviewRepository = {
  async findApprovedActive(params?: { featured?: boolean; limit?: number }) {
    const where: Prisma.ReviewWhereInput = { status: 'approved', isActive: true };
    if (params?.featured) where.isFeatured = true;

    return prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit,
    });
  },

  async countApprovedActive() {
    return prisma.review.count({ where: { status: 'approved', isActive: true } });
  },

  async averageApprovedActiveRating() {
    const result = await prisma.review.aggregate({
      where: { status: 'approved', isActive: true },
      _avg: { rating: true },
    });
    return result._avg.rating || 0;
  },

  async findApproved() {
    return prisma.review.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({ data });
  },
};
