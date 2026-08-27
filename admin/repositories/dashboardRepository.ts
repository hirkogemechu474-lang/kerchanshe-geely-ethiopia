/**
 * DashboardRepository — server-only Prisma queries backing the admin
 * dashboard's analytics summary and quick-stats widgets.
 */
import { prisma } from '@/lib/prisma';

export const dashboardRepository = {
  async countActiveVehicles() {
    return prisma.vehicle.count({ where: { isActive: true } });
  },

  async countAllVehicles() {
    return prisma.vehicle.count();
  },

  async countTestDrives() {
    return prisma.testDrive.count();
  },

  async countTestDrivesSince(since: Date) {
    return prisma.testDrive.count({ where: { createdAt: { gte: since } } });
  },

  async countTestDrivesByStatus(status: string) {
    return prisma.testDrive.count({ where: { status } });
  },

  async countQuotations() {
    return prisma.quotation.count();
  },

  async countQuotationsByStatusIn(statuses: string[]) {
    return prisma.quotation.count({ where: { status: { in: statuses } } });
  },

  async countServiceBookings() {
    return prisma.serviceBooking.count();
  },

  async countServiceBookingsByStatusIn(statuses: string[]) {
    return prisma.serviceBooking.count({ where: { status: { in: statuses } } });
  },

  async countMessagesUnread() {
    return prisma.message.count({ where: { status: 'unread' } });
  },

  async countMessages() {
    return prisma.message.count();
  },

  async countReviewsByStatus(status: string) {
    return prisma.review.count({ where: { status } });
  },

  async countReviews() {
    return prisma.review.count();
  },

  async findApprovedReviewsForRating() {
    return prisma.review.findMany({
      where: { status: 'approved' },
      select: { rating: true, createdAt: true },
    });
  },

  async groupQuotationsByStatus() {
    return prisma.quotation.groupBy({ by: ['status'], _count: true });
  },

  async groupTopTestDriveVehicles(limit = 5) {
    return prisma.testDrive.groupBy({
      by: ['vehicleId'],
      _count: true,
      orderBy: { _count: { vehicleId: 'desc' } },
      take: limit,
    });
  },

  async findVehicleCategoriesByIds(ids: string[]) {
    return prisma.vehicle.findMany({ where: { id: { in: ids } }, select: { id: true, category: true } });
  },

  async findTopVehiclesByTestDrives(limit = 5) {
    return prisma.vehicle.findMany({
      take: limit,
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        _count: { select: { testDrives: true } },
      },
      orderBy: { testDrives: { _count: 'desc' } },
    });
  },

  // ── Sales pipeline (payment/agreement/handover progress) ──────────────
  async getSalesPipelineCounts() {
    return Promise.all([
      prisma.salesOrder.count({ where: { paymentStatus: 'UNPAID' } }),
      prisma.salesOrder.count({ where: { paymentStatus: 'PENDING_REVIEW' } }),
      prisma.salesOrder.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalPrice: true }, _count: true }),
      prisma.salesOrder.count({ where: { approvedAt: { not: null } } }),
      prisma.salesOrder.count({ where: { agreementSentAt: { not: null } } }),
      prisma.salesOrder.count({ where: { signedDocumentUrl: { not: null } } }),
      prisma.salesOrder.count({ where: { countersignedAt: { not: null } } }),
      prisma.salesOrder.count({ where: { status: 'DELIVERED' } }),
      prisma.salesOrder.count({ where: { handoverSignedDocumentUrl: { not: null } } }),
      prisma.salesOrder.count({ where: { handoverCountersignedAt: { not: null } } }),
      prisma.testDrive.count({ where: { salesOrderId: { not: null } } }),
    ]);
  },
};
