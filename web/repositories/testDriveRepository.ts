/**
 * TestDriveRepository — server-only Prisma queries for test drives.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const testDriveRepository = {
  async findById(id: string) {
    return prisma.testDrive.findUnique({ where: { id } });
  },

  async findByIdWithVehicleName(id: string) {
    return prisma.testDrive.findUnique({
      where: { id },
      include: { vehicle: { select: { name: true } } },
    });
  },

  async updateStatus(id: string, status: string) {
    return prisma.testDrive.update({ where: { id }, data: { status } });
  },

  async findMany(params?: { status?: string; startDate?: string | null; endDate?: string | null }) {
    const where: Prisma.TestDriveWhereInput = {};
    if (params?.status && params.status !== 'all') where.status = params.status;
    if (params?.startDate && params?.endDate) {
      where.preferredDate = { gte: new Date(params.startDate), lte: new Date(params.endDate) };
    }

    return prisma.testDrive.findMany({
      where,
      include: {
        vehicle: { select: { id: true, name: true, model: true, year: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.TestDriveCreateInput) {
    return prisma.testDrive.create({ data, include: { vehicle: true } });
  },
};
