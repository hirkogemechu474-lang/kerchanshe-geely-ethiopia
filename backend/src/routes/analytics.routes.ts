import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/analytics (admin analytics dashboard data — full shape consumed by
// apps/admin/app/admin/analytics/page.tsx's normalizeAnalyticsData()).
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - 3);
    const openJobCardWhere = { status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] as ('INVOICED_CLOSED' | 'CANCELLED')[] } };

    const [
      totalVehicles, totalTestDrives, totalQuotations, totalServiceBookings, totalReviews, avgRatingAgg,
      recentTestDrives, recentQuotations, recentReviews,
      testDriveVehicles, testDrivesByVehicle,
      pendingQuotations, pendingReviews, unreadMessages, overdueJobCards, partsForReorderCheck,
      baysBusy, baysTotal, jobsToday, closedJobCardDurations, pendingApproval, warrantyClaimsByStatusRaw, bays,
      paymentUnpaid, paymentPendingReview, paymentPaid, paymentCollectedAgg,
      agreementApproved, agreementSent, agreementSigned, agreementCountersigned,
      handoverDelivered, handoverSigned, handoverCountersigned, orderLinkedTestDrives,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.testDrive.count(),
      prisma.quotation.count(),
      prisma.serviceBooking.count(),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.testDrive.count({ where: { createdAt: { gte: startDate } } }),
      prisma.quotation.count({ where: { createdAt: { gte: startDate } } }),
      prisma.review.count({ where: { createdAt: { gte: startDate } } }),
      prisma.testDrive.findMany({ select: { vehicle: { select: { category: true, categoryId: true } } } }),
      prisma.testDrive.groupBy({ by: ['vehicleId'], _count: true, orderBy: { _count: { vehicleId: 'desc' } }, take: 5 }),
      prisma.quotation.count({ where: { status: { notIn: ['converted', 'closed'] } } }),
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.message.count({ where: { status: 'unread' } }),
      prisma.jobCard.count({ where: { ...openJobCardWhere, openTs: { lt: overdueThreshold } } }),
      prisma.sparePart.findMany({ where: { isActive: true }, select: { stock: true, reorderPoint: true } }),
      prisma.serviceBay.count({ where: { isActive: true, status: 'OCCUPIED' } }),
      prisma.serviceBay.count({ where: { isActive: true } }),
      prisma.jobCard.count({ where: { openTs: { gte: startOfToday } } }),
      prisma.jobCard.findMany({ where: { closeTs: { not: null } }, select: { openTs: true, closeTs: true }, orderBy: { closeTs: 'desc' }, take: 200 }),
      prisma.jobCard.count({ where: { status: 'AWAITING_APPROVAL' } }),
      prisma.warrantyClaim.groupBy({ by: ['status'], _count: true }),
      prisma.serviceBay.findMany({ where: { isActive: true }, select: { id: true, name: true, status: true }, orderBy: { name: 'asc' } }),
      prisma.salesOrder.count({ where: { paymentStatus: 'UNPAID' } }),
      prisma.salesOrder.count({ where: { paymentStatus: 'PENDING_REVIEW' } }),
      prisma.salesOrder.count({ where: { paymentStatus: 'PAID' } }),
      prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { paymentStatus: 'PAID' } }),
      prisma.salesOrder.count({ where: { approvedAt: { not: null } } }),
      prisma.salesOrder.count({ where: { agreementSentAt: { not: null } } }),
      prisma.salesOrder.count({ where: { signedAt: { not: null } } }),
      prisma.salesOrder.count({ where: { countersignedAt: { not: null } } }),
      prisma.salesOrder.count({ where: { status: 'DELIVERED' } }),
      prisma.salesOrder.count({ where: { handoverSignedAt: { not: null } } }),
      prisma.salesOrder.count({ where: { handoverCountersignedAt: { not: null } } }),
      prisma.testDrive.count({ where: { salesOrderId: { not: null } } }),
    ]);

    // Group test drives by vehicle category. Vehicle.category is free text
    // and can carry inconsistent casing/pluralization for the same real
    // category (e.g. "Sedan" vs "sedans"), so group by categoryId (the
    // actual FK) and label each group with its most common category text.
    const categoryGroups = new Map<string, { count: number; labels: Map<string, number> }>();
    for (const { vehicle } of testDriveVehicles) {
      const key = vehicle.categoryId || vehicle.category;
      const group = categoryGroups.get(key) || { count: 0, labels: new Map<string, number>() };
      group.count += 1;
      group.labels.set(vehicle.category, (group.labels.get(vehicle.category) || 0) + 1);
      categoryGroups.set(key, group);
    }
    const testDrivesByCategory = [...categoryGroups.values()]
      .map((group) => ({
        category: [...group.labels.entries()].sort((a, b) => b[1] - a[1])[0][0],
        count: group.count,
      }))
      .sort((a, b) => b.count - a.count);

    const topVehicleIds = testDrivesByVehicle.map((v) => v.vehicleId);
    const topVehicleRows = topVehicleIds.length
      ? await prisma.vehicle.findMany({ where: { id: { in: topVehicleIds } }, select: { id: true, name: true } })
      : [];
    const vehicleNameById = new Map(topVehicleRows.map((v) => [v.id, v.name]));
    const topVehicles = testDrivesByVehicle.map((v) => ({
      name: vehicleNameById.get(v.vehicleId) || 'Unknown vehicle',
      testDrives: v._count,
    }));

    const partsBelowReorder = partsForReorderCheck.filter((p) => p.stock <= p.reorderPoint).length;

    const durations = closedJobCardDurations
      .map((jc) => (jc.closeTs ? (jc.closeTs.getTime() - jc.openTs.getTime()) / 60000 : null))
      .filter((m): m is number => m != null && m >= 0);
    const avgTurnaroundMinutes = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

    res.json({
      overview: {
        totalVehicles,
        totalTestDrives,
        totalQuotations,
        totalServiceBookings,
        totalReviews,
        avgRating: avgRatingAgg._avg.rating || 0,
      },
      recentActivity: {
        testDrives: recentTestDrives,
        quotations: recentQuotations,
        reviews: recentReviews,
      },
      salesByCategory: testDrivesByCategory,
      topVehicles,
      needsAttention: {
        pendingQuotations,
        pendingReviews,
        unreadMessages,
        overdueJobCards,
        partsBelowReorder,
      },
      workshop: {
        kpis: {
          baysBusy,
          baysTotal,
          jobsToday,
          avgTurnaroundMinutes,
          pendingApproval,
          overdueCount: overdueJobCards,
          partsBelowReorder,
        },
        bays,
        warrantyClaimsByStatus: warrantyClaimsByStatusRaw.map((w) => ({ status: w.status, count: w._count })),
      },
      salesPipeline: {
        payment: {
          unpaid: paymentUnpaid,
          pendingReview: paymentPendingReview,
          paid: paymentPaid,
          totalCollected: paymentCollectedAgg._sum?.totalPrice || 0,
        },
        agreement: {
          approved: agreementApproved,
          sent: agreementSent,
          signed: agreementSigned,
          countersigned: agreementCountersigned,
        },
        handover: {
          delivered: handoverDelivered,
          signed: handoverSigned,
          countersigned: handoverCountersigned,
        },
        orderLinkedTestDrives,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/dashboard/stats (admin dashboard stats)
router.get('/dashboard/stats', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const [totalVehicles, activeOrders, pendingQuotations, activeJobCards, totalCustomers, totalRevenue] = await Promise.all([
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.salesOrder.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
      prisma.quotation.count({ where: { status: { notIn: ['converted', 'closed'] } } }),
      prisma.jobCard.count({ where: { status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] } } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { status: 'DELIVERED' } }),
    ]);

    res.json({ totalVehicles, activeOrders, pendingQuotations, activeJobCards, totalCustomers, totalRevenue: totalRevenue._sum?.totalPrice || 0 });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/analytics/vitals (web vitals collection)
router.post('/vitals', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { metric, value, url } = req.body;
    // No WebVital table exists in schema.prisma (this endpoint has no
    // current caller — apps/web/lib/performance.ts only console.logs
    // vitals client-side). Just log server-side rather than fabricating a
    // Prisma model/migration outside this fix's scope.
    console.log('[web-vitals]', { metric, value, url, userAgent: req.headers['user-agent'] || '' });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Vitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as analyticsRoutes };
