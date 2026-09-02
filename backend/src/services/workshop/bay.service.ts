import { serviceBayRepository } from '../../repositories';

export const bayService = {
  async list(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bays = await serviceBayRepository.findAll();
      return { ok: true, data: bays };
    } catch (error: any) {
      console.error('[BAY LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch bays.' };
    }
  },

  async listActive(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bays = await serviceBayRepository.findActive();
      return { ok: true, data: bays };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch active bays.' };
    }
  },

  async create(data: { name: string; bayType: string; capacity?: number }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bay = await serviceBayRepository.create({
        name: data.name,
        bayType: data.bayType,
        status: 'FREE',
        isActive: true,
        ...(data.capacity !== undefined && { capacity: data.capacity }),
      });
      return { ok: true, data: bay };
    } catch (error: any) {
      console.error('[BAY CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create bay.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bay = await serviceBayRepository.update(id, data);
      return { ok: true, data: bay };
    } catch (error: any) {
      console.error('[BAY UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update bay.' };
    }
  },

  async deactivate(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bay = await serviceBayRepository.deactivate(id);
      return { ok: true, data: bay };
    } catch (error: any) {
      console.error('[BAY DEACTIVATE ERROR]', error.message);
      return { ok: false, error: 'Failed to deactivate bay.' };
    }
  },
};
