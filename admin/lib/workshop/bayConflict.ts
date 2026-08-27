import { prisma } from '@/lib/prisma';

/** Shared by create/assign routes: finds a conflicting job card on the same bay/time window (BR-008). */
export async function findBayConflict(
  bayId: string,
  start: Date,
  end: Date,
  excludeJobCardId?: string
) {
  return prisma.jobCard.findFirst({
    where: {
      bayId,
      id: excludeJobCardId ? { not: excludeJobCardId } : undefined,
      status: { notIn: ['CANCELLED', 'INVOICED_CLOSED'] },
      scheduledStart: { not: null },
      scheduledEnd: { not: null },
      AND: [{ scheduledStart: { lt: end } }, { scheduledEnd: { gt: start } }],
    },
    select: { id: true, jobCardNo: true },
  });
}
