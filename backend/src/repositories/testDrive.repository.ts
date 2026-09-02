import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const testDriveRepository = {
  async findAll() {
    return prisma.testDrive.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async create(data: Prisma.TestDriveCreateInput) {
    return prisma.testDrive.create({ data });
  },

  async findByIdWithVehicle(id: string) {
    return prisma.testDrive.findUnique({
      where: { id },
      include: { vehicle: { select: { name: true, slug: true } } },
    });
  },

  async findById(id: string) {
    return prisma.testDrive.findUnique({ where: { id } });
  },

  async update(id: string, data: Prisma.TestDriveUpdateInput) {
    return prisma.testDrive.update({ where: { id }, data });
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

  async findByIdWithVehicleName(id: string) {
    return prisma.testDrive.findUnique({
      where: { id },
      include: { vehicle: { select: { name: true } } },
    });
  },

  async findByReferenceForStatus(reference: string) {
    return prisma.testDrive.findUnique({
      where: { reference },
      select: { status: true, createdAt: true },
    });
  },
};
