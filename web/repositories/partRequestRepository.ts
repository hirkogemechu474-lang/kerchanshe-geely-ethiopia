/**
 * PartRequestRepository — server-only Prisma queries for spare-part requests.
 */
import { prisma } from '@/lib/prisma';

export const partRequestRepository = {
  async findByReferenceForStatus(reference: string) {
    return prisma.partRequest.findUnique({
      where: { reference },
      select: { status: true, createdAt: true },
    });
  },
};
