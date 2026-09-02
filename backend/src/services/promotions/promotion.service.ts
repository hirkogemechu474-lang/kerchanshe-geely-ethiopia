import { promotionRepository } from '../../repositories';

export const promotionService = {
  async listAll(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const promotions = await promotionRepository.findAll();
      return { ok: true, data: promotions };
    } catch (error: any) {
      console.error('[PROMOTION LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch promotions.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const promotion = await promotionRepository.findById(id);
      if (!promotion) return { ok: false, error: 'Promotion not found.' };
      return { ok: true, data: promotion };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch promotion.' };
    }
  },

  async create(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const promotion = await promotionRepository.create(data);
      return { ok: true, data: promotion };
    } catch (error: any) {
      console.error('[PROMOTION CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create promotion.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const promotion = await promotionRepository.update(id, data);
      return { ok: true, data: promotion };
    } catch (error: any) {
      console.error('[PROMOTION UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update promotion.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await promotionRepository.delete(id);
      return { ok: true };
    } catch (error: any) {
      console.error('[PROMOTION DELETE ERROR]', error.message);
      return { ok: false, error: 'Failed to delete promotion.' };
    }
  },

  async getActivePublic(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const promotions = await promotionRepository.findActive();
      return { ok: true, data: promotions };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch promotions.' };
    }
  },

  async listByStatus(status?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const promotions = await promotionRepository.findMany(status);
      return { ok: true, data: promotions };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch promotions.' };
    }
  },
};
