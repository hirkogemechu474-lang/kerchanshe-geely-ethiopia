/**
 * ShowroomVisitRepository — server-only Prisma queries for the QR walk-in
 * showroom visit flow (admin's browse/report surface).
 */
import { prisma } from '@/lib/prisma';

export const showroomVisitRepository = {
  async findPage(where: { status?: string } | undefined, skip: number, take: number) {
    return Promise.all([
      prisma.showroomVisit.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.showroomVisit.count({ where }),
      prisma.showroomVisit.groupBy({ by: ['status'], _count: true }),
    ]);
  },
};
