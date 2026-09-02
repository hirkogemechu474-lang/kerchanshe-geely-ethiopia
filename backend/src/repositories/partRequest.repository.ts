import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const partRequestRepository = {
  async findPage(where: Prisma.PartRequestWhereInput, skip: number, take: number) {
    return Promise.all([
      prisma.partRequest.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.partRequest.count({ where }),
      prisma.partRequest.groupBy({ by: ['status'], _count: true }),
    ]);
  },

  async findById(id: string) {
    return prisma.partRequest.findUnique({ where: { id }, include: { items: true } });
  },

  async update(id: string, data: Prisma.PartRequestUpdateInput) {
    return prisma.partRequest.update({ where: { id }, data, include: { items: true } });
  },

  async delete(id: string) {
    return prisma.partRequest.delete({ where: { id } });
  },

  async findMany(params?: { status?: string; category?: string }) {
    const where: Prisma.PartRequestWhereInput = {};
    if (params?.status && params.status !== 'all') where.status = params.status;
    if (params?.category && params.category !== 'all') where.category = params.category;

    return prisma.partRequest.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.PartRequestCreateInput) {
    return prisma.partRequest.create({ data, include: { items: true } });
  },

  async findByReferenceForStatus(reference: string) {
    return prisma.partRequest.findUnique({
      where: { reference },
      select: { status: true, createdAt: true },
    });
  },
};
