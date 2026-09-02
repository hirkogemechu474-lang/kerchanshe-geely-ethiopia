import { dashboardRepository, customerRepository } from '../../repositories';

export const dashboardSummaryService = {
  async getSummary(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [orderStats, recentOrders, recentJobCards, customerCounts] = await Promise.all([
        dashboardRepository.getOrderStats(),
        dashboardRepository.findRecentOrders(5),
        dashboardRepository.findRecentJobCards(5),
        Promise.all([
          customerRepository.countCustomers(),
          customerRepository.countVehicles(),
          customerRepository.countVehiclesUnderWarranty(),
        ]),
      ]);

      return {
        ok: true,
        data: {
          orders: orderStats,
          recentOrders,
          recentJobCards,
          customers: {
            total: customerCounts[0],
            vehicles: customerCounts[1],
            underWarranty: customerCounts[2],
          },
        },
      };
    } catch (error: any) {
      console.error('[DASHBOARD SUMMARY ERROR]', error.message);
      return { ok: false, error: 'Failed to generate dashboard summary.' };
    }
  },
};
