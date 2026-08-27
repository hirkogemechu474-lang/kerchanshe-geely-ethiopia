import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getWorkshopSummary } from '@/lib/services/workshop/dashboardSummary';

// Payment, agreement, and handover progress across every SalesOrder —
// requested as "all report for payment and also on agreement and also on
// other" for the main dashboard. Each funnel count is independent (an
// order can be, e.g., both approved AND signed AND countersigned at once)
// rather than mutually exclusive buckets, so a viewer can see exactly
// where orders are piling up in the pipeline.
async function getSalesPipelineSummary() {
  const [
    unpaidCount,
    pendingReviewCount,
    paidAgg,
    approvedCount,
    sentCount,
    signedCount,
    countersignedCount,
    deliveredCount,
    handoverSignedCount,
    handoverCountersignedCount,
    orderLinkedTestDrives,
  ] = await Promise.all([
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

  return {
    payment: {
      unpaid: unpaidCount,
      pendingReview: pendingReviewCount,
      paid: paidAgg._count,
      totalCollected: paidAgg._sum.totalPrice ?? 0,
    },
    agreement: {
      approved: approvedCount,
      sent: sentCount,
      signed: signedCount,
      countersigned: countersignedCount,
    },
    handover: {
      delivered: deliveredCount,
      signed: handoverSignedCount,
      countersigned: handoverCountersignedCount,
    },
    orderLinkedTestDrives,
  };
}

export async function GET() {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  try {
    // Fetch all data in parallel for better performance
    const [
      totalVehicles,
      totalTestDrives,
      totalQuotations,
      totalServiceBookings,
      reviews,
      testDrivesByMonth,
      quotationsByStatus,
      testDrivesByCategory,
      topVehicles,
    ] = await Promise.all([
      // Total vehicles
      prisma.vehicle.count({
        where: { isActive: true },
      }),

      // Total test drives
      prisma.testDrive.count(),

      // Total quotations
      prisma.quotation.count(),

      // Total service bookings
      prisma.serviceBooking.count(),

      // Reviews with average rating
      prisma.review.findMany({
        where: { status: 'approved' },
        select: { rating: true, createdAt: true },
      }),

      // Test drives this month
      prisma.testDrive.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Quotations by status
      prisma.quotation.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Test drives by vehicle category
      prisma.testDrive.groupBy({
        by: ['vehicleId'],
        _count: true,
        orderBy: {
          _count: {
            vehicleId: 'desc',
          },
        },
        take: 5,
      }),

      // Top vehicles by test drives
      prisma.vehicle.findMany({
        take: 5,
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          _count: {
            select: {
              testDrives: true,
            },
          },
        },
        orderBy: {
          testDrives: {
            _count: 'desc',
          },
        },
      }),
    ]);

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Count pending quotations
    const pendingQuotations = quotationsByStatus.find(q => q.status === 'new')?._count || 0;

    // Group test drives by category
    const vehicleIds = testDrivesByCategory.map(td => td.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, category: true },
    });

    const categoryMap = new Map(vehicles.map(v => [v.id, v.category]));
    const categoryCount = new Map<string, number>();

    testDrivesByCategory.forEach(td => {
      const category = categoryMap.get(td.vehicleId) || 'Unknown';
      categoryCount.set(category, (categoryCount.get(category) || 0) + td._count);
    });

    const salesByCategory = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Format top vehicles
    const formattedTopVehicles = topVehicles.map(vehicle => ({
      name: vehicle.name,
      testDrives: vehicle._count.testDrives,
    }));

    // Unified Dashboard: workshop/SWMS + "needs attention" sections are only
    // fetched (and only returned) for viewers who can actually see them, so a
    // sales-only session never receives workshop internals and vice versa.
    const permissions = session!.user.permissions;

    const [workshop, pendingReviewCount, unreadMessageCount, salesPipeline] = await Promise.all([
      permissions.canViewJobCards ? getWorkshopSummary() : Promise.resolve(null),
      permissions.canModerateReviews ? prisma.review.count({ where: { status: 'pending' } }) : Promise.resolve(0),
      permissions.canViewMessages ? prisma.message.count({ where: { status: 'unread' } }) : Promise.resolve(0),
      permissions.canViewQuotations ? getSalesPipelineSummary() : Promise.resolve(null),
    ]);

    const needsAttention = {
      pendingQuotations: permissions.canViewQuotations ? pendingQuotations : 0,
      pendingReviews: pendingReviewCount,
      unreadMessages: unreadMessageCount,
      overdueJobCards: workshop?.kpis.overdueCount ?? 0,
      partsBelowReorder: workshop?.kpis.partsBelowReorder ?? 0,
    };

    // Build response
    const analyticsData = {
      overview: {
        totalVehicles,
        totalTestDrives,
        totalQuotations,
        totalServiceBookings,
        totalReviews: reviews.length,
        avgRating: Number(avgRating.toFixed(1)),
      },
      recentActivity: {
        testDrives: testDrivesByMonth,
        quotations: pendingQuotations,
        reviews: reviews.filter(r => {
          // Reviews from last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return r.createdAt >= thirtyDaysAgo;
        }).length,
      },
      salesByCategory,
      topVehicles: formattedTopVehicles,
      needsAttention,
      workshop: workshop
        ? {
            kpis: workshop.kpis,
            bays: workshop.bays,
            warrantyClaimsByStatus: workshop.warrantyClaimsByStatus,
          }
        : null,
      salesPipeline,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
