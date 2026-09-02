import { sparePartRepository } from '../../repositories';

export const sparePartStockService = {
  async getStockLevels(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const parts = await sparePartRepository.findAll();

      const stockData = parts.map((part) => ({
        id: part.id,
        sku: part.sku,
        name: part.name,
        stock: part.stock,
        reorderPoint: part.reorderPoint,
        status: part.stock === 0 ? 'OUT_OF_STOCK' : part.stock <= part.reorderPoint ? 'LOW_STOCK' : 'IN_STOCK',
      }));

      return { ok: true, data: stockData };
    } catch (error: any) {
      console.error('[STOCK LEVELS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch stock levels.' };
    }
  },

  async updateStock(id: string, adjustment: number, reason: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const part = await sparePartRepository.update(id, {
        stock: { increment: adjustment },
      });

      return { ok: true, data: part };
    } catch (error: any) {
      console.error('[STOCK UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update stock.' };
    }
  },

  async getLowStockAlerts(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const stockLevels = await sparePartRepository.findActiveStockLevels();

      const lowStock = stockLevels.filter((item) => item.stock <= item.reorderPoint);

      return { ok: true, data: lowStock };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch low stock alerts.' };
    }
  },
};
