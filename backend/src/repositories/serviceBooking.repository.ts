import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const serviceBookingRepository = {
  async findByIdWithJobCard(id: string) {
    return prisma.serviceBooking.findUnique({
      where: { id },
      include: { jobCard: true },
    });
  },

  async findMany(params?: { status?: string; serviceType?: string }) {
    const where: any = {};
    if (params?.status && params.status !== 'all') where.status = params.status;
    if (params?.serviceType && params.serviceType !== 'all') where.serviceType = params.serviceType;

    return prisma.serviceBooking.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  },

  async create(data: Prisma.ServiceBookingCreateInput) {
    return prisma.serviceBooking.create({ data });
  },

  async findTodayUnconvertedByPhone(customerPhone: string, todayStart: Date, todayEnd: Date) {
    return prisma.serviceBooking.findFirst({
      where: {
        customerPhone,
        date: { gte: todayStart, lte: todayEnd },
        jobCard: null,
      },
      orderBy: { date: 'asc' },
    });
  },

  async findByReferenceForStatus(reference: string) {
    return prisma.serviceBooking.findUnique({
      where: { reference },
      select: { status: true, createdAt: true, serviceType: true },
    });
  },
};
