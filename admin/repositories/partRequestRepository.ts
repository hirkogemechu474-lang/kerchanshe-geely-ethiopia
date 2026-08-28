/**
 * PartRequestRepository — server-only Prisma queries for spare-parts
 * enquiry requests and their line items.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const partRequestRepository = {
  // Status counts ignore the search/status filter itself so the stat
  // tiles always reflect the whole table, not just the current view.
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
};
