/**
 * Admin vehicle repository — server-only Prisma queries with full access.
 */
import { prisma } from '@/lib/prisma';

export const vehicleRepository = {
  async findAll(params?: {
    status?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page     = params?.page     ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const skip     = (page - 1) * pageSize;

    const where = {
      ...(params?.status     && { status: params.status }),
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.search     && {
        OR: [
          { name:  { contains: params.search, mode: 'insensitive' as const } },
          { model: { contains: params.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: { vehicleCategory: true, brand: true },
        orderBy: { displayOrder: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { vehicles, total, page, pageSize };
  },

  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: { vehicleCategory: true, brand: true },
    });
  },

  async create(data: Parameters<typeof prisma.vehicle.create>[0]['data']) {
    return prisma.vehicle.create({ data, include: { vehicleCategory: true, brand: true } });
  },

  async update(id: string, data: Parameters<typeof prisma.vehicle.update>[0]['data']) {
    return prisma.vehicle.update({ where: { id }, data, include: { vehicleCategory: true, brand: true } });
  },

  async delete(id: string) {
    return prisma.vehicle.delete({ where: { id } });
  },
};
