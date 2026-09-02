import { vehicleRepository, contentRepository } from '../../repositories';

export const publicVehicleService = {
  async listPublished(params?: {
    category?: string;
    brand?: string;
    search?: string;
    limit?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = { isActive: true, status: 'published' };

      if (params?.category) {
        const cat = await contentRepository.findActiveCategoryBySlug(params.category);
        if (cat) where.categoryId = cat.id;
      }

      const vehicles = await vehicleRepository.findManyPublic(where, params?.limit);
      return { ok: true, data: vehicles };
    } catch (error: any) {
      console.error('[PUBLIC VEHICLE LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch vehicles.' };
    }
  },

  async getBySlug(slug: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.findPublicBySlug(slug);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };

      const configuration = await vehicleRepository.findConfiguration(vehicle.id);

      return {
        ok: true,
        data: {
          ...vehicle,
          configuration,
        },
      };
    } catch (error: any) {
      console.error('[PUBLIC VEHICLE GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch vehicle.' };
    }
  },

  async getFeatured(limit = 6): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where = { isActive: true, status: 'published' as const, isFeatured: true };
      const vehicles = await vehicleRepository.findManyPublic(where, limit);
      return { ok: true, data: vehicles };
    } catch (error: any) {
      console.error('[PUBLIC VEHICLE FEATURED ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch featured vehicles.' };
    }
  },

  async getConfiguration(vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const configuration = await vehicleRepository.findConfiguration(vehicleId);
      return { ok: true, data: configuration };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch configuration.' };
    }
  },
};
