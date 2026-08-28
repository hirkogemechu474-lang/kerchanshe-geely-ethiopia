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

  async findAllActive() {
    return prisma.dealer.findMany({
      where: { active: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    });
  },

  async findActiveById(id: string) {
    return prisma.dealer.findFirst({ where: { id, active: true } });
  },

  // ── Legacy /api/dealers route ───────────────────────────────────────────
  // Preserved as-is: references fields (`isActive`, `hours`) that don't
  // exist on this model and JSON.parses columns that are already Json-typed
  // — pre-existing, unreferenced by any frontend code (superseded by
  // findAllActive() above / /api/public/dealers). Kept untyped so this
  // dead code's exact (broken) runtime behavior isn't silently changed.
  async findManyLegacy(where: any) {
    return prisma.dealer.findMany({ where, orderBy: { salesCount: 'desc' } });
  },

  async createLegacy(data: any) {
    return prisma.dealer.create({ data });
  },
};
