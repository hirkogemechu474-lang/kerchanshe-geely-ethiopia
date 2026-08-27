/**
 * JobCardRepository — server-only Prisma queries for job cards, as touched
 * by web's self-service kiosk check-in flow (the full workshop job-card
 * surface lives in admin).
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const jobCardRepository = {
  async nextJobCardNo(): Promise<string> {
    const counter = await prisma.counter.upsert({
      where: { name: 'jobCard' },
      create: { name: 'jobCard', value: 1001 },
      update: { value: { increment: 1 } },
    });
    return `JC-${counter.value}`;
  },

  async create(data: Prisma.JobCardCreateInput) {
    return prisma.jobCard.create({ data });
  },

  async countDraftCheckinToday(todayStart: Date, todayEnd: Date) {
    return prisma.jobCard.count({
      where: { status: 'DRAFT_CHECKIN', openTs: { gte: todayStart, lte: todayEnd } },
    });
  },
};
