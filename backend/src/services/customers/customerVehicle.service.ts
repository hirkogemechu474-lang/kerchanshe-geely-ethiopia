import { customerRepository, customerVehicleRepository } from '../../repositories';

export const customerVehicleService = {
  async lookupByVin(vin: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerVehicleRepository.findByVin(vin);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
      return { ok: true, data: vehicle };
    } catch (error: any) {
      return { ok: false, error: 'Failed to lookup vehicle.' };
    }
  },

  async lookupByPlateNo(plateNo: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerVehicleRepository.findByPlateNo(plateNo);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
      return { ok: true, data: vehicle };
    } catch (error: any) {
      return { ok: false, error: 'Failed to lookup vehicle.' };
    }
  },

  async lookupByVinOrPlate(vin?: string, plateNo?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerRepository.findVehicleByVinOrPlateWithHistory(vin, plateNo);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
      return { ok: true, data: vehicle };
    } catch (error: any) {
      return { ok: false, error: 'Failed to lookup vehicle.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerRepository.findVehicleById(id);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
      return { ok: true, data: vehicle };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch vehicle.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerRepository.updateVehicle(id, data);
      return { ok: true, data: vehicle };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update vehicle.' };
    }
  },
};
