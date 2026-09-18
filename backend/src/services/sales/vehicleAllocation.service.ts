import { vehicleAllocationRepository, vehicleRepository, salesOrderRepository } from '../../repositories';
import { prisma } from '../../config/database';
import { seedPdiChecklist } from './pdiChecklist.template';

export const vehicleAllocationService = {
  // Reserves a stock unit (status RESERVED — see POST .../allocate on
  // orders.routes.ts for the later RESERVED -> ALLOCATED step, which locks a
  // specific VIN once payment is verified). Upserts rather than requiring a
  // fresh row every time, since orderId is @unique on VehicleAllocation and
  // a released/previous reservation on the same order must be replaced, not
  // duplicated. Switching to a different vehicleId rebalances stock: the
  // previous vehicle's unit is returned before the new one is taken.
  async allocate(orderId: string, vehicleId: string, extra?: { vin?: string | null; allocatedById?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await vehicleAllocationRepository.findByOrderId(orderId);
      if (existing && existing.status === 'ALLOCATED') {
        return { ok: false, error: 'This order already has an allocated vehicle. Release it first.' };
      }
      if (existing && existing.vehicleId === vehicleId && existing.status !== 'RELEASED') {
        return { ok: true, data: existing };
      }

      const vehicle = await vehicleRepository.findById(vehicleId);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
      if (vehicle.stock <= 0) {
        return { ok: false, error: 'Vehicle is out of stock.' };
      }

      if (existing && existing.status !== 'RELEASED') {
        await vehicleRepository.updateVehicle(existing.vehicleId, { stock: { increment: 1 } });
      }
      await vehicleRepository.updateVehicle(vehicleId, { stock: { decrement: 1 } });

      const allocation = existing
        ? await vehicleAllocationRepository.update(orderId, {
            vehicleId,
            vin: extra?.vin ?? null,
            status: 'RESERVED',
            releasedAt: null,
            allocatedAt: new Date(),
            ...(extra?.allocatedById && { allocatedById: extra.allocatedById }),
          })
        : await vehicleAllocationRepository.create({
            orderId,
            vehicleId,
            allocatedAt: new Date(),
            ...(extra?.vin && { vin: extra.vin }),
            ...(extra?.allocatedById && { allocatedById: extra.allocatedById }),
          });

      return { ok: true, data: allocation };
    } catch (error: any) {
      console.error('[ALLOCATION ERROR]', error.message);
      return { ok: false, error: 'Failed to allocate vehicle.' };
    }
  },

  // RESERVED -> ALLOCATED — locks a specific VIN to the order. No stock
  // change (the unit was already taken out of stock at reserve time).
  async lockAllocation(orderId: string, vin?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await vehicleAllocationRepository.findByOrderId(orderId);
      if (!existing) return { ok: false, error: 'Reserve a vehicle before allocating it.' };
      if (existing.status === 'ALLOCATED') return { ok: true, data: existing };

      const allocation = await vehicleAllocationRepository.update(orderId, {
        status: 'ALLOCATED',
        ...(vin && { vin }),
      });
      await seedPdiChecklist(prisma, orderId);
      return { ok: true, data: allocation };
    } catch (error: any) {
      console.error('[ALLOCATION LOCK ERROR]', error.message);
      return { ok: false, error: 'Failed to allocate vehicle.' };
    }
  },

  // Releases the reservation/allocation and returns the stock unit — flips
  // to RELEASED rather than deleting the row, so allocation history
  // survives (the enum already had RELEASED, previously unused).
  async deallocate(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await vehicleAllocationRepository.findByOrderId(orderId);
      if (!existing || existing.status === 'RELEASED') return { ok: false, error: 'No allocation found for this order.' };

      await vehicleRepository.updateVehicle(existing.vehicleId, {
        stock: { increment: 1 },
      });

      const released = await vehicleAllocationRepository.update(orderId, { status: 'RELEASED', releasedAt: new Date() });

      return { ok: true, data: released };
    } catch (error: any) {
      console.error('[DEALLOCATION ERROR]', error.message);
      return { ok: false, error: 'Failed to deallocate vehicle.' };
    }
  },

  async getAllocation(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const allocation = await vehicleAllocationRepository.findByOrderId(orderId);
      return { ok: true, data: allocation };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch allocation.' };
    }
  },

  async replaceAllocation(orderId: string, newVehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const deallocateResult = await this.deallocate(orderId);
      if (!deallocateResult.ok) return deallocateResult;

      return this.allocate(orderId, newVehicleId);
    } catch (error: any) {
      console.error('[REPLACE ALLOCATION ERROR]', error.message);
      return { ok: false, error: 'Failed to replace allocation.' };
    }
  },
};
