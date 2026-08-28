/**
 * JobCardRepository — server-only Prisma queries for workshop job cards.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const jobCardRepository = {
  async create(data: Prisma.JobCardCreateInput) {
    return prisma.jobCard.create({ data });
  },
};
