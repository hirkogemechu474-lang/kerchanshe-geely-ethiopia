import { sparePartRepository } from '../../repositories';

export const reorderAlertsService = {
  async checkLowStock(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const stockLevels = await sparePartRepository.findActiveStockLevels();

      const lowStockItems = stockLevels.filter(
        (item) => item.stock <= item.reorderPoint
      );

      return {
        ok: true,
        data: {
          totalLowStock: lowStockItems.length,
          items: lowStockItems,
        },
      };
    } catch (error: any) {
      console.error('[REORDER ALERTS ERROR]', error.message);
      return { ok: false, error: 'Failed to check low stock.' };
    }
  },

  async getReorderSummary(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const stockLevels = await sparePartRepository.findActiveStockLevels();

      const summary = {
        total: stockLevels.length,
        inStock: stockLevels.filter((item) => item.stock > item.reorderPoint).length,
        lowStock: stockLevels.filter((item) => item.stock > 0 && item.stock <= item.reorderPoint).length,
        outOfStock: stockLevels.filter((item) => item.stock === 0).length,
      };

      return { ok: true, data: summary };
    } catch (error: any) {
      console.error('[REORDER SUMMARY ERROR]', error.message);
      return { ok: false, error: 'Failed to generate reorder summary.' };
    }
  },
};
