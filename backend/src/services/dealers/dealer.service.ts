import { dealerRepository } from '../../repositories';

export const dealerService = {
  async list(params?: { q?: string; city?: string; region?: string; type?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealers = await dealerRepository.findMany(params || {});
      return { ok: true, data: dealers };
    } catch (error: any) {
      console.error('[DEALER LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch dealers.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealer = await dealerRepository.findById(id);
      if (!dealer) return { ok: false, error: 'Dealer not found.' };
      return { ok: true, data: dealer };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch dealer.' };
    }
  },

  async create(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealer = await dealerRepository.create(data);
      return { ok: true, data: dealer };
    } catch (error: any) {
      console.error('[DEALER CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create dealer.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealer = await dealerRepository.update(id, data);
      return { ok: true, data: dealer };
    } catch (error: any) {
      console.error('[DEALER UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update dealer.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await dealerRepository.delete(id);
      return { ok: true };
    } catch (error: any) {
      console.error('[DEALER DELETE ERROR]', error.message);
      return { ok: false, error: 'Failed to delete dealer.' };
    }
  },
};
