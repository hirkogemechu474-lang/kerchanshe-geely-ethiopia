import { vehicleRepository } from '../../repositories';

export const vehicleService = {
  async list(params?: {
    status?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const result = await vehicleRepository.findAll(params);
      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[VEHICLE LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch vehicles.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.findByIdWithDetail(id);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
      return { ok: true, data: vehicle };
    } catch (error: any) {
      console.error('[VEHICLE GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch vehicle.' };
    }
  },

  async create(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.createVehicle(data);
      return { ok: true, data: vehicle };
    } catch (error: any) {
      console.error('[VEHICLE CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create vehicle.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.updateVehicle(id, data);
      return { ok: true, data: vehicle };
    } catch (error: any) {
      console.error('[VEHICLE UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update vehicle.' };
    }
  },

  async archive(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.archive(id);
      return { ok: true, data: vehicle };
    } catch (error: any) {
      console.error('[VEHICLE ARCHIVE ERROR]', error.message);
      return { ok: false, error: 'Failed to archive vehicle.' };
    }
  },

  async listForAdmin(params: { where: any; skip: number; take: number }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [total, vehicles] = await vehicleRepository.findManyForAdmin(params.where, params.skip, params.take);
      return { ok: true, data: { vehicles, total, page: Math.floor(params.skip / params.take) + 1, pageSize: params.take } };
    } catch (error: any) {
      console.error('[VEHICLE ADMIN LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch vehicles.' };
    }
  },

  async getAccessories(vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const accessories = await vehicleRepository.findAccessories(vehicleId);
      return { ok: true, data: accessories };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch accessories.' };
    }
  },

  async createAccessory(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const accessory = await vehicleRepository.createAccessory(data);
      return { ok: true, data: accessory };
    } catch (error: any) {
      return { ok: false, error: 'Failed to create accessory.' };
    }
  },

  async updateAccessory(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const accessory = await vehicleRepository.updateAccessory(id, data);
      return { ok: true, data: accessory };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update accessory.' };
    }
  },

  async deleteAccessory(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await vehicleRepository.deleteAccessory(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete accessory.' };
    }
  },

  async getColors(vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const colors = await vehicleRepository.findColors(vehicleId);
      return { ok: true, data: colors };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch colors.' };
    }
  },

  async createColor(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const color = await vehicleRepository.createColor(data);
      return { ok: true, data: color };
    } catch (error: any) {
      return { ok: false, error: 'Failed to create color.' };
    }
  },

  async updateColor(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const color = await vehicleRepository.updateColor(id, data);
      return { ok: true, data: color };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update color.' };
    }
  },

  async deleteColor(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await vehicleRepository.deleteColor(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete color.' };
    }
  },

  async getInteriors(vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const interiors = await vehicleRepository.findInteriors(vehicleId);
      return { ok: true, data: interiors };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch interiors.' };
    }
  },

  async createInterior(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const interior = await vehicleRepository.createInterior(data);
      return { ok: true, data: interior };
    } catch (error: any) {
      return { ok: false, error: 'Failed to create interior.' };
    }
  },

  async updateInterior(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const interior = await vehicleRepository.updateInterior(id, data);
      return { ok: true, data: interior };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update interior.' };
    }
  },

  async deleteInterior(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await vehicleRepository.deleteInterior(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete interior.' };
    }
  },

  async getPackages(vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const packages = await vehicleRepository.findPackages(vehicleId);
      return { ok: true, data: packages };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch packages.' };
    }
  },

  async createPackage(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const pkg = await vehicleRepository.createPackage(data);
      return { ok: true, data: pkg };
    } catch (error: any) {
      return { ok: false, error: 'Failed to create package.' };
    }
  },

  async updatePackage(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const pkg = await vehicleRepository.updatePackage(id, data);
      return { ok: true, data: pkg };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update package.' };
    }
  },

  async deletePackage(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await vehicleRepository.deletePackage(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete package.' };
    }
  },

  async getWheels(vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const wheels = await vehicleRepository.findWheels(vehicleId);
      return { ok: true, data: wheels };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch wheels.' };
    }
  },

  async createWheel(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const wheel = await vehicleRepository.createWheel(data);
      return { ok: true, data: wheel };
    } catch (error: any) {
      return { ok: false, error: 'Failed to create wheel.' };
    }
  },

  async updateWheel(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const wheel = await vehicleRepository.updateWheel(id, data);
      return { ok: true, data: wheel };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update wheel.' };
    }
  },

  async deleteWheel(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await vehicleRepository.deleteWheel(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete wheel.' };
    }
  },
};
