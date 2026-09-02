import { prisma } from '../config/database';

export const vehicleAllocationRepository = {
  async findByOrderId(orderId: string) {
    return prisma.vehicleAllocation.findUnique({
      where: { orderId },
      include: { vehicle: { select: { id: true, name: true, model: true, stock: true } } },
    });
  },

  async create(data: Parameters<typeof prisma.vehicleAllocation.create>[0]['data']) {
    return prisma.vehicleAllocation.create({
      data,
      include: { vehicle: { select: { id: true, name: true, model: true, stock: true } } },
    });
  },

  async update(orderId: string, data: Parameters<typeof prisma.vehicleAllocation.update>[0]['data']) {
    return prisma.vehicleAllocation.update({
      where: { orderId },
      data,
      include: { vehicle: { select: { id: true, name: true, model: true, stock: true } } },
    });
  },

  async delete(orderId: string) {
    return prisma.vehicleAllocation.delete({ where: { orderId } });
  },
};
