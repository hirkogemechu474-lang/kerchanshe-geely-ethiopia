import { dealerRepository } from '../../repositories';

export const publicDealerService = {
  async list(city?: string, region?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealers = await dealerRepository.findManyPublic(city, region);
      return { ok: true, data: dealers };
    } catch (error: any) {
      console.error('[PUBLIC DEALER LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch dealers.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealer = await dealerRepository.findActiveById(id);
      if (!dealer) return { ok: false, error: 'Dealer not found.' };
      return { ok: true, data: dealer };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch dealer.' };
    }
  },

  async listAll(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealers = await dealerRepository.findAllActive();
      return { ok: true, data: dealers };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch dealers.' };
    }
  },
};
