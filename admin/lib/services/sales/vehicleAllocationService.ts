import { vehicleAllocationRepository, AllocationError } from '@/repositories/vehicleAllocationRepository';

export type AllocationResult =
  | { ok: true; allocation: any }
  | { ok: false; httpStatus: 404 | 409 | 500; error: string };

/** Reserve or update the vehicle allocated to an order. */
export async function allocateVehicle(orderId: string, vehicleId: string, vin: string | null, allocatedById: string): Promise<AllocationResult> {
  try {
    const allocation = await vehicleAllocationRepository.allocate(orderId, vehicleId, vin, allocatedById);
    return { ok: true, allocation };
  } catch (error) {
    if (error instanceof AllocationError) {
      if (error.message === 'ORDER_NOT_FOUND' || error.message === 'VEHICLE_NOT_FOUND') {
        return { ok: false, httpStatus: 404, error: 'Unable to allocate vehicle.' };
      }
      if (error.message === 'VEHICLE_ALREADY_ALLOCATED') {
        return { ok: false, httpStatus: 409, error: 'Vehicle is already allocated to another order.' };
      }
      if (error.message === 'VEHICLE_OUT_OF_STOCK') {
        return { ok: false, httpStatus: 409, error: 'Vehicle is out of stock.' };
      }
    }
    return { ok: false, httpStatus: 500, error: 'Unable to allocate vehicle.' };
  }
}

/** Release a reservation and return the unit to stock. */
export async function releaseVehicleAllocation(orderId: string, releasedById: string): Promise<AllocationResult> {
  try {
    const allocation = await vehicleAllocationRepository.release(orderId, releasedById);
    return { ok: true, allocation };
  } catch (error) {
    if (error instanceof AllocationError && error.message === 'ALLOCATION_NOT_FOUND') {
      return { ok: false, httpStatus: 404, error: 'No active allocation found.' };
    }
    return { ok: false, httpStatus: 500, error: 'Unable to release vehicle allocation.' };
  }
}
