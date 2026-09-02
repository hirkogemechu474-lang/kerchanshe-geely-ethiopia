import { vehicleAllocationRepository, vehicleRepository, salesOrderRepository } from '../../repositories';

export const vehicleAllocationService = {
  async allocate(orderId: string, vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await vehicleAllocationRepository.findByOrderId(orderId);
      if (existing) return { ok: false, error: 'Vehicle already allocated to this order.' };

      const vehicle = await vehicleRepository.findById(vehicleId);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };

      if (vehicle.stock <= 0) {
        return { ok: false, error: 'Vehicle is out of stock.' };
      }

      const allocation = await vehicleAllocationRepository.create({
        orderId,
        vehicleId,
        allocatedAt: new Date(),
      });

      await vehicleRepository.updateVehicle(vehicleId, {
        stock: { decrement: 1 },
      });

      return { ok: true, data: allocation };
    } catch (error: any) {
      console.error('[ALLOCATION ERROR]', error.message);
      return { ok: false, error: 'Failed to allocate vehicle.' };
    }
  },

  async deallocate(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await vehicleAllocationRepository.findByOrderId(orderId);
      if (!existing) return { ok: false, error: 'No allocation found for this order.' };

      await vehicleRepository.updateVehicle(existing.vehicleId, {
        stock: { increment: 1 },
      });

      await vehicleAllocationRepository.delete(orderId);

      return { ok: true };
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
