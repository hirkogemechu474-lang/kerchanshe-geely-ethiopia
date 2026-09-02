import { prisma } from '../config/database';
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

  async findVehicleById(id: string) {
    return prisma.customerVehicle.findUnique({ where: { id } });
  },

  async findVehicleByVinOrPlateWithHistory(vin: string | undefined, plate: string | undefined) {
    return prisma.customerVehicle.findFirst({
      where: vin ? { vin: { equals: vin, mode: 'insensitive' } } : { plateNo: { equals: plate!, mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        jobCards: {
          orderBy: { openTs: 'desc' },
          take: 10,
          select: { id: true, jobCardNo: true, status: true, complaintText: true, openTs: true, closeTs: true },
        },
      },
    });
  },

  async findByPhone(phone: string) {
    return prisma.customer.findFirst({ where: { phone } });
  },

  async create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  },

  async createVehicle(data: Prisma.CustomerVehicleCreateInput) {
    return prisma.customerVehicle.create({ data });
  },
};
