/**
 * JobCardRepository — server-only Prisma queries for workshop job cards.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, JobCardStatus } from '@prisma/client';

export const jobCardRepository = {
  async create(data: Prisma.JobCardCreateInput) {
    return prisma.jobCard.create({ data, include: { technician: true, bay: true } });
  },

  async findMany(where: Prisma.JobCardWhereInput) {
    return prisma.jobCard.findMany({
      where,
      include: {
        technician: { select: { id: true, name: true } },
        bay: { select: { id: true, name: true, bayType: true } },
      },
      orderBy: { openTs: 'desc' },
      take: 200,
    });
  },

  async findManyForBoard(dayStart: Date, dayEnd: Date) {
    return prisma.jobCard.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        OR: [
          { scheduledStart: { gte: dayStart, lte: dayEnd } },
          { AND: [{ scheduledStart: null }, { openTs: { gte: dayStart, lte: dayEnd } }] },
        ],
      },
      include: {
        technician: { select: { id: true, name: true } },
        bay: { select: { id: true, name: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.jobCard.findUnique({ where: { id } });
  },

  async findByIdWithDetail(id: string) {
    return prisma.jobCard.findUnique({
      where: { id },
      include: {
        technician: true,
        bay: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
        jobCardParts: { include: { sparePart: true }, orderBy: { requestedAt: 'asc' } },
        warrantyClaims: { orderBy: { createdAt: 'desc' } },
        customerVehicle: {
          include: {
            customer: { select: { fullName: true, phone: true } },
            jobCards: { select: { id: true }, orderBy: { openTs: 'desc' } },
          },
        },
      },
    });
  },

  async update(id: string, data: Prisma.JobCardUpdateInput) {
    return prisma.jobCard.update({ where: { id }, data });
  },

  async transitionStatus(
    id: string,
    fromStatus: JobCardStatus,
    jobCardData: Prisma.JobCardUpdateInput,
    historyData: { toStatus: JobCardStatus; changedById: string; reasonCode: string | null },
    freeBayId: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.jobCard.update({ where: { id }, data: jobCardData });

      await tx.jobCardStatusHistory.create({
        data: { jobCardId: id, fromStatus, toStatus: historyData.toStatus, changedById: historyData.changedById, reasonCode: historyData.reasonCode },
      });

      if (freeBayId) {
        await tx.serviceBay.update({ where: { id: freeBayId }, data: { status: 'FREE' } });
      }

      return result;
    });
  },

  async assignTechnicianBay(
    id: string,
    data: Prisma.JobCardUpdateInput,
    previousBayId: string | null,
    nextBayId: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.jobCard.update({
        where: { id },
        data,
        include: { technician: true, bay: true },
      });

      // BR-010: rescheduling a job card automatically frees its previous bay slot.
      if (previousBayId && previousBayId !== nextBayId) {
        const stillOccupied = await tx.jobCard.findFirst({
          where: { bayId: previousBayId, status: { notIn: ['CANCELLED', 'INVOICED_CLOSED'] }, id: { not: id } },
        });
        if (!stillOccupied) {
          await tx.serviceBay.update({ where: { id: previousBayId }, data: { status: 'FREE' } });
        }
      }
      if (nextBayId) {
        await tx.serviceBay.update({ where: { id: nextBayId }, data: { status: 'OCCUPIED' } });
      }

      return result;
    });
  },
};
