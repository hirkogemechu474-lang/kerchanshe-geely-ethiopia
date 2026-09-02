import { vehicleRepository } from '../../repositories';

export const brochureService = {
  async getBrochureData(vehicleId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.findById(vehicleId);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };

      const configuration = await vehicleRepository.findConfiguration(vehicleId);

      return {
        ok: true,
        data: {
          vehicle,
          configuration,
        },
      };
    } catch (error: any) {
      console.error('[BROCHURE ERROR]', error.message);
      return { ok: false, error: 'Failed to generate brochure data.' };
    }
  },

  async getBrochureBySlug(slug: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.findPublicBySlug(slug);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };

      const configuration = await vehicleRepository.findConfiguration(vehicle.id);

      return {
        ok: true,
        data: {
          vehicle,
          configuration,
        },
      };
    } catch (error: any) {
      console.error('[BROCHURE SLUG ERROR]', error.message);
      return { ok: false, error: 'Failed to generate brochure data.' };
    }
  },
};
