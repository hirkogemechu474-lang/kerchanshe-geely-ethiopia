/**
 * CustomerRepository — server-only Prisma queries for Customer and
 * CustomerVehicle (SWMS Phase 6 vehicle-ownership records).
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const customerRepository = {
  async search(q?: string) {
    const where: Prisma.CustomerWhereInput | undefined = q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { vehicles: { some: { vin: { contains: q, mode: 'insensitive' } } } },
            { vehicles: { some: { plateNo: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : undefined;

    return prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        vehicles: { select: { id: true, plateNo: true, vin: true, model: true, warrantyEndDate: true } },
      },
    });
  },

  async countCustomers() {
    return prisma.customer.count();
  },
  async countVehicles() {
    return prisma.customerVehicle.count();
  },
  async countVehiclesUnderWarranty() {
    return prisma.customerVehicle.count({ where: { warrantyEndDate: { gte: new Date() } } });
  },

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: {
          orderBy: { updatedAt: 'desc' },
          include: {
            jobCards: {
              orderBy: { openTs: 'desc' },
              take: 10,
              select: { id: true, jobCardNo: true, status: true, complaintText: true, openTs: true, closeTs: true },
            },
          },
        },
      },
    });
  },

  async update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  async updateVehicle(id: string, data: Prisma.CustomerVehicleUpdateInput) {
    return prisma.customerVehicle.update({ where: { id }, data });
  },
};
