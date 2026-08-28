/**
 * PartRequestRepository — server-only Prisma queries for spare-part requests.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const partRequestRepository = {
  async findByReferenceForStatus(reference: string) {
    return prisma.partRequest.findUnique({
      where: { reference },
      select: { status: true, createdAt: true },
    });
  },

  async create(data: Prisma.PartRequestCreateInput) {
    return prisma.partRequest.create({ data, include: { items: true } });
  },
};
