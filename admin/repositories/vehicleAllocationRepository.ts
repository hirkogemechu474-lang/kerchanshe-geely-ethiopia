/**
 * VehicleAllocationRepository — server-only Prisma queries for reserving a
 * specific Vehicle unit against a SalesOrder (VehicleAllocation), including
 * the stock adjustments that go with reserving/releasing a unit.
 */
import { prisma } from '@/lib/prisma';

export class AllocationError extends Error {}

export const vehicleAllocationRepository = {
  /** Reserve or update the vehicle allocated to an order. */
  async allocate(orderId: string, vehicleId: string, vin: string | null, allocatedById: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new AllocationError('ORDER_NOT_FOUND');

      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle || !vehicle.isActive) throw new AllocationError('VEHICLE_NOT_FOUND');

      const busy = await tx.vehicleAllocation.findFirst({
        where: { vehicleId, status: { in: ['RESERVED', 'ALLOCATED'] }, orderId: { not: orderId } },
      });
      if (busy) throw new AllocationError('VEHICLE_ALREADY_ALLOCATED');

      const existing = await tx.vehicleAllocation.findUnique({ where: { orderId } });
      if (!existing || existing.status === 'RELEASED') {
        if (vehicle.stock < 1) throw new AllocationError('VEHICLE_OUT_OF_STOCK');
        await tx.vehicle.update({ where: { id: vehicleId }, data: { stock: { decrement: 1 } } });
      } else if (existing.vehicleId !== vehicleId) {
        await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { stock: { increment: 1 } } });
        if (vehicle.stock < 1) throw new AllocationError('VEHICLE_OUT_OF_STOCK');
        await tx.vehicle.update({ where: { id: vehicleId }, data: { stock: { decrement: 1 } } });
      }

      return tx.vehicleAllocation.upsert({
        where: { orderId },
        create: { orderId, vehicleId, vin, allocatedById, status: 'RESERVED' },
        update: { vehicleId, vin, status: 'RESERVED', releasedAt: null, allocatedById },
        include: { vehicle: { select: { id: true, name: true, model: true, stock: true } } },
      });
    });
  },

  /** Release a reservation and return the unit to stock. */
  async release(orderId: string, releasedById: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.vehicleAllocation.findUnique({ where: { orderId } });
      if (!current || current.status === 'RELEASED') throw new AllocationError('ALLOCATION_NOT_FOUND');
      await tx.vehicle.update({ where: { id: current.vehicleId }, data: { stock: { increment: 1 } } });
      return tx.vehicleAllocation.update({
        where: { orderId },
        data: { status: 'RELEASED', releasedAt: new Date(), allocatedById: releasedById },
      });
    });
  },
};
