/**
 * VehicleRepository — server-only Prisma queries for vehicles.
 * Use this in API routes and server components, not in client components.
 */
import { prisma } from '@/lib/prisma';

export const vehicleRepository = {
  /** Find all active, published vehicles ordered by displayOrder */
  async findAll(params?: { featured?: boolean; categoryId?: string; limit?: number }) {
    return prisma.vehicle.findMany({
      where: {
        isActive: true,
        status: 'published',
        ...(params?.featured !== undefined && { isFeatured: params.featured }),
        ...(params?.categoryId && { categoryId: params.categoryId }),
      },
      include: { vehicleCategory: true, brand: true },
      orderBy: { displayOrder: 'asc' },
      ...(params?.limit && { take: params.limit }),
    });
  },

  /** Find a single vehicle by slug */
  async findBySlug(slug: string) {
    return prisma.vehicle.findFirst({
      where: { slug, isActive: true },
      include: { vehicleCategory: true, brand: true },
    });
  },

  /** Find a single vehicle by id */
  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: { vehicleCategory: true, brand: true },
    });
  },

  /** Count active vehicles per category */
  async countByCategory() {
    return prisma.vehicle.groupBy({
      by: ['categoryId'],
      where: { isActive: true, status: 'published' },
      _count: { id: true },
    });
  },
};
