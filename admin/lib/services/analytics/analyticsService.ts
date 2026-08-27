import { dashboardRepository } from '@/repositories/dashboardRepository';
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
  ] = await dashboardRepository.getSalesPipelineCounts();

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

export interface AnalyticsPermissions {
  canViewJobCards: boolean;
  canModerateReviews: boolean;
  canViewMessages: boolean;
  canViewQuotations: boolean;
}

export async function getAnalyticsData(permissions: AnalyticsPermissions) {
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
    dashboardRepository.countActiveVehicles(),
    dashboardRepository.countTestDrives(),
    dashboardRepository.countQuotations(),
    dashboardRepository.countServiceBookings(),
    dashboardRepository.findApprovedReviewsForRating(),
    dashboardRepository.countTestDrivesSince(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    dashboardRepository.groupQuotationsByStatus(),
    dashboardRepository.groupTopTestDriveVehicles(5),
    dashboardRepository.findTopVehiclesByTestDrives(5),
  ]);

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  // Count pending quotations
  const pendingQuotations = quotationsByStatus.find(q => q.status === 'new')?._count || 0;

  // Group test drives by category
  const vehicleIds = testDrivesByCategory.map(td => td.vehicleId);
  const vehicles = await dashboardRepository.findVehicleCategoriesByIds(vehicleIds);

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
  const [workshop, pendingReviewCount, unreadMessageCount, salesPipeline] = await Promise.all([
    permissions.canViewJobCards ? getWorkshopSummary() : Promise.resolve(null),
    permissions.canModerateReviews ? dashboardRepository.countReviewsByStatus('pending') : Promise.resolve(0),
    permissions.canViewMessages ? dashboardRepository.countMessagesUnread() : Promise.resolve(0),
    permissions.canViewQuotations ? getSalesPipelineSummary() : Promise.resolve(null),
  ]);

  const needsAttention = {
    pendingQuotations: permissions.canViewQuotations ? pendingQuotations : 0,
    pendingReviews: pendingReviewCount,
    unreadMessages: unreadMessageCount,
    overdueJobCards: workshop?.kpis.overdueCount ?? 0,
    partsBelowReorder: workshop?.kpis.partsBelowReorder ?? 0,
  };

  return {
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
}
