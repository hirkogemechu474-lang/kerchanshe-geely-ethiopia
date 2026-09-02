import { prisma } from '../../config/database';

export const analyticsService = {
  async getDashboardStats(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const [
        totalOrders,
        ordersThisMonth,
        totalJobCards,
        jobCardsThisMonth,
        totalCustomers,
        totalRevenue,
        revenueThisMonth,
        totalLeads,
        leadsThisMonth,
      ] = await Promise.all([
        prisma.salesOrder.count(),
        prisma.salesOrder.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.jobCard.count(),
        prisma.jobCard.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.customer.count(),
        prisma.salesOrder.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalPrice: true } }),
        prisma.salesOrder.aggregate({
          where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
          _sum: { totalPrice: true },
        }),
        prisma.lead.count(),
        prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
      ]);

      return {
        ok: true,
        data: {
          orders: { total: totalOrders, thisMonth: ordersThisMonth },
          jobCards: { total: totalJobCards, thisMonth: jobCardsThisMonth },
          customers: { total: totalCustomers },
          revenue: {
            total: totalRevenue._sum.totalPrice || 0,
            thisMonth: revenueThisMonth._sum.totalPrice || 0,
          },
          leads: { total: totalLeads, thisMonth: leadsThisMonth },
        },
      };
    } catch (error: any) {
      console.error('[ANALYTICS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch analytics.' };
    }
  },

  async getOrderTrends(months = 6): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const trends = [];

      for (let i = months - 1; i >= 0; i--) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const count = await prisma.salesOrder.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        });

        trends.push({
          month: startDate.toISOString().substring(0, 7),
          count,
        });
      }

      return { ok: true, data: trends };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch order trends.' };
    }
  },

  async getTopVehicles(limit = 5): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const topVehicles = await prisma.salesOrder.groupBy({
        by: ['vehicleModel'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });

      return {
        ok: true,
        data: topVehicles.map((v) => ({
          model: v.vehicleModel,
          count: v._count.id,
        })),
      };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch top vehicles.' };
    }
  },
};
