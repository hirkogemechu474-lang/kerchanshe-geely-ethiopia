import { customerVehicleRepository } from '../../repositories';

export const vehicleLookupService = {
  async lookupByVin(vin: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerVehicleRepository.findByVin(vin);
      if (!vehicle) return { ok: false, error: 'Vehicle not found by VIN.' };
      return { ok: true, data: vehicle };
    } catch (error: any) {
      console.error('[VEHICLE LOOKUP VIN ERROR]', error.message);
      return { ok: false, error: 'Failed to lookup vehicle.' };
    }
  },

  async lookupByPlateNo(plateNo: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerVehicleRepository.findByPlateNo(plateNo);
      if (!vehicle) return { ok: false, error: 'Vehicle not found by plate number.' };
      return { ok: true, data: vehicle };
    } catch (error: any) {
      console.error('[VEHICLE LOOKUP PLATE ERROR]', error.message);
      return { ok: false, error: 'Failed to lookup vehicle.' };
    }
  },

  async lookup(vin?: string, plateNo?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    if (vin) return this.lookupByVin(vin);
    if (plateNo) return this.lookupByPlateNo(plateNo);
    return { ok: false, error: 'Please provide a VIN or plate number.' };
  },
};
