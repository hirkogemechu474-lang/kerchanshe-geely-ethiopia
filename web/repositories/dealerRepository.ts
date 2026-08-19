/**
 * DealerRepository — server-only Prisma queries for dealers.
 */
import { prisma } from '@/lib/prisma';

export const dealerRepository = {
  async findAll(params?: { city?: string; active?: boolean }) {
    return prisma.dealer.findMany({
      where: {
        ...(params?.active !== undefined && { active: params.active }),
        ...(params?.city && { city: { contains: params.city, mode: 'insensitive' } }),
      },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.dealer.findUnique({ where: { id } });
  },

  async findBySlug(slug: string) {
    return prisma.dealer.findFirst({ where: { id: slug } });
  },
};
