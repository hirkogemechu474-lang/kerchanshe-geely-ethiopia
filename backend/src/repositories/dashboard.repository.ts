import { prisma } from '../config/database';

export const dashboardRepository = {
  async findRecentOrders(limit = 10) {
    return prisma.salesOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, orderNo: true, customerName: true, customerPhone: true,
        vehicleModel: true, totalPrice: true, status: true, createdAt: true,
      },
    });
  },

  async findRecentJobCards(limit = 10) {
    return prisma.jobCard.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, jobCardNo: true, plateNo: true, customerName: true,
        customerPhone: true, vehicleModel: true, status: true, createdAt: true,
      },
    });
  },

  async getOrderStats() {
    const [totalOrders, pendingOrders, deliveredOrders, totalRevenue] = await Promise.all([
      prisma.salesOrder.count(),
      prisma.salesOrder.count({ where: { status: { in: ['QUOTED', 'BOOKED', 'FINANCING_PENDING'] } } }),
      prisma.salesOrder.count({ where: { status: 'DELIVERED' } }),
      prisma.salesOrder.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalPrice: true } }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
    };
  },
};
