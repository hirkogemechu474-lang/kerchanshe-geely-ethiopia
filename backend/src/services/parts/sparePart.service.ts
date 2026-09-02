import { sparePartRepository } from '../../repositories';

export const sparePartService = {
  async listAdmin(params?: { category?: string; search?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const parts = await sparePartRepository.findAll();
      let filtered = parts;

      if (params?.category && params.category !== 'all') {
        filtered = filtered.filter((p) => p.category === params.category);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        );
      }

      return { ok: true, data: filtered };
    } catch (error: any) {
      console.error('[SPARE PART LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch spare parts.' };
    }
  },

  async create(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await sparePartRepository.findBySku(data.sku);
      if (existing) return { ok: false, error: 'SKU already exists.' };

      const part = await sparePartRepository.create(data);
      return { ok: true, data: part };
    } catch (error: any) {
      console.error('[SPARE PART CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create spare part.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      if (data.sku) {
        const existing = await sparePartRepository.findBySkuExcludingId(data.sku, id);
        if (existing) return { ok: false, error: 'SKU already exists.' };
      }

      const part = await sparePartRepository.update(id, data);
      return { ok: true, data: part };
    } catch (error: any) {
      console.error('[SPARE PART UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update spare part.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await sparePartRepository.delete(id);
      return { ok: true };
    } catch (error: any) {
      console.error('[SPARE PART DELETE ERROR]', error.message);
      return { ok: false, error: 'Failed to delete spare part.' };
    }
  },

  async listPublic(params?: { category?: string; search?: string; inStock?: boolean }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const parts = await sparePartRepository.findMany(params);
      return { ok: true, data: parts };
    } catch (error: any) {
      console.error('[SPARE PART PUBLIC LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch spare parts.' };
    }
  },
};
