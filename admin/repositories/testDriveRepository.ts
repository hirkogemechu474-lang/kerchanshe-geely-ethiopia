/**
 * TestDriveRepository — server-only Prisma queries for test drives.
 */
import { prisma } from '@/lib/prisma';
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
};
