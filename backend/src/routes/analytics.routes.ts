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

    // Leadership/BI block (revenue by showroom, sales mix, quarterly trend,
    // financial snapshot, risk flags) — restricted to the executive-dashboard
    // permission since it's company-wide financial data, unlike the
    // operational counts above which every admin role already sees.
    //
    // Everything here is scoped to bookings (SalesOrder.orderDate), not
    // deliveries — the platform is ~1 month old, so delivery-based figures
    // would be near-empty and wouldn't reflect actual sales pace. "Achievement
    // %" / "vs Plan" figures compare against SalesTarget, the one place a
    // target actually exists; a dealer/month with no target row gets `null`
    // (not a fabricated 0% or 100%). Gross margin, net profit, market share,
    // and YoY comparisons are deliberately NOT computed here — this system
    // has no cost/COGS data, no external market data, and (being ~1 month
    // old) no prior-year baseline to compare against.
    const isExecutive = req.adminSession?.user.permissions.canViewExecutiveDashboards ?? false;
    let leadership = null;
    if (isExecutive) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const staleUnpaidThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const staleQuotationThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentYearStr = String(now.getFullYear());

      const [
        yearOrders, totalOrdersAllStatuses,
        unpaidSumAgg, pendingReviewSumAgg, receivablesAgedAgg, cashCollectedMTDAgg,
        last30dBookedCount,
        staleUnpaidOrders, pendingDiscountApprovals, staleQuotations,
        activeVehicles, monthTargets, yearCompanyTargets,
      ] = await Promise.all([
        prisma.salesOrder.findMany({
          where: { status: { not: 'CANCELLED' }, orderDate: { gte: startOfYear } },
          select: { totalPrice: true, orderDate: true, salesAgentId: true, vehicleModel: true },
        }),
        prisma.salesOrder.count(),
        prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { paymentStatus: 'UNPAID' } }),
        prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { paymentStatus: 'PENDING_REVIEW' } }),
        prisma.salesOrder.aggregate({
          _sum: { totalPrice: true },
          where: { paymentStatus: { in: ['UNPAID', 'PENDING_REVIEW'] }, orderDate: { lt: sixtyDaysAgo } },
        }),
        prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { paymentConfirmedAt: { gte: startOfMonth } } }),
        prisma.salesOrder.count({ where: { status: { not: 'CANCELLED' }, orderDate: { gte: thirtyDaysAgo } } }),
        prisma.salesOrder.count({ where: { paymentStatus: 'UNPAID', orderDate: { lt: staleUnpaidThreshold } } }),
        prisma.quotation.count({ where: { managerApprovalStatus: 'PENDING_DISCOUNT' } }),
        prisma.quotation.count({ where: { status: 'new', createdAt: { lt: staleQuotationThreshold } } }),
        prisma.vehicle.findMany({ where: { isActive: true }, select: { stock: true, basePrice: true, finalPrice: true } }),
        prisma.salesTarget.findMany({ where: { month: currentMonthStr } }),
        prisma.salesTarget.findMany({ where: { month: { startsWith: currentYearStr }, dealerId: null } }),
      ]);

      const mtdOrders = yearOrders.filter((o) => o.orderDate >= startOfMonth);
      const companyTarget = monthTargets.find((t) => t.dealerId === null) || null;
      const dealerTargetMap = new Map(monthTargets.filter((t) => t.dealerId).map((t) => [t.dealerId as string, t]));

      // Revenue by showroom (MTD): SalesOrder has no direct dealer link, so
      // this attributes revenue via the closing agent's assigned branch
      // (User.dealerId) — the same territory field the lead-assignment
      // engine already relies on. Orders with no agent, or an agent with no
      // assigned branch, land in "Unassigned".
      const agentIds = [...new Set(mtdOrders.map((o) => o.salesAgentId).filter((id): id is string => !!id))];
      const agents = agentIds.length
        ? await prisma.user.findMany({ where: { id: { in: agentIds } }, select: { id: true, dealerId: true } })
        : [];
      const agentDealerMap = new Map(agents.map((a) => [a.id, a.dealerId]));
      const dealerIds = [...new Set(agents.map((a) => a.dealerId).filter((id): id is string => !!id))];
      const dealers = dealerIds.length
        ? await prisma.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, name: true } })
        : [];
      const dealerNameMap = new Map(dealers.map((d) => [d.id, d.name]));

      const showroomAgg = new Map<string, { name: string; revenue: number; units: number }>();
      for (const o of mtdOrders) {
        const dealerId = o.salesAgentId ? agentDealerMap.get(o.salesAgentId) : null;
        const key = dealerId || 'unassigned';
        const name = dealerId ? dealerNameMap.get(dealerId) || 'Unknown Showroom' : 'Unassigned';
        const entry = showroomAgg.get(key) || { name, revenue: 0, units: 0 };
        entry.revenue += o.totalPrice || 0;
        entry.units += 1;
        showroomAgg.set(key, entry);
      }
      const revenueByShowroom = [...showroomAgg.entries()]
        .map(([dealerId, v]) => {
          const target = dealerId !== 'unassigned' ? dealerTargetMap.get(dealerId)?.revenueTarget ?? null : null;
          return {
            dealerId,
            name: v.name,
            revenue: v.revenue,
            units: v.units,
            target,
            achievementPct: target && target > 0 ? Math.round((v.revenue / target) * 100) : null,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      // Sales mix by model (MTD) — magnitude + revenue per model, tail folded
      // into "Other" past the categorical color ceiling (8 slots; see chartPalette.ts).
      const modelAgg = new Map<string, { count: number; revenue: number }>();
      for (const o of mtdOrders) {
        const entry = modelAgg.get(o.vehicleModel) || { count: 0, revenue: 0 };
        entry.count += 1;
        entry.revenue += o.totalPrice || 0;
        modelAgg.set(o.vehicleModel, entry);
      }
      const modelsSorted = [...modelAgg.entries()]
        .map(([model, v]) => ({ model, count: v.count, revenue: v.revenue }))
        .sort((a, b) => b.count - a.count);
      const MIX_CAP = 7;
      const salesMixByModel = modelsSorted.length > MIX_CAP
        ? [
            ...modelsSorted.slice(0, MIX_CAP),
            {
              model: 'Other',
              count: modelsSorted.slice(MIX_CAP).reduce((s, m) => s + m.count, 0),
              revenue: modelsSorted.slice(MIX_CAP).reduce((s, m) => s + m.revenue, 0),
            },
          ]
        : modelsSorted;

      // Quarterly revenue — the current calendar year's 4 quarters, actual
      // bookings vs. plan (sum of that quarter's 3 monthly company-wide
      // targets, only when all 3 months are set — never a partial/implied
      // plan). The in-progress quarter also gets a naive same-pace
      // full-quarter projection so a partial actual isn't mistaken for the
      // quarter's final number.
      const yearTargetByMonth = new Map(yearCompanyTargets.map((t) => [t.month, t.revenueTarget]));
      const quarterlyRevenue = [0, 1, 2, 3].map((qIndex) => {
        const monthsInQuarter = [qIndex * 3, qIndex * 3 + 1, qIndex * 3 + 2];
        const quarterStart = new Date(now.getFullYear(), monthsInQuarter[0], 1);
        const quarterEnd = new Date(now.getFullYear(), monthsInQuarter[2] + 1, 1);
        const actual = yearOrders
          .filter((o) => o.orderDate >= quarterStart && o.orderDate < quarterEnd)
          .reduce((s, o) => s + (o.totalPrice || 0), 0);
        const monthKeys = monthsInQuarter.map((m) => `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`);
        const targets = monthKeys.map((k) => yearTargetByMonth.get(k));
        const plan = targets.every((t) => t !== undefined) ? (targets as number[]).reduce((a, b) => a + b, 0) : null;
        const isCurrent = now >= quarterStart && now < quarterEnd;
        let projectedActual: number | null = null;
        if (isCurrent && actual > 0) {
          const daysElapsed = Math.max(1, Math.ceil((now.getTime() - quarterStart.getTime()) / 86400000));
          const daysInQuarter = Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / 86400000);
          projectedActual = Math.round((actual / daysElapsed) * daysInQuarter);
        }
        return {
          quarter: `${now.getFullYear()}-Q${qIndex + 1}`,
          label: `Q${qIndex + 1} ${now.getFullYear()}`,
          actual: quarterStart <= now ? actual : 0,
          plan,
          isCurrent,
          isFuture: quarterStart > now,
          projectedActual,
        };
      });

      const revenueMTD = mtdOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
      const unitsSoldMTD = mtdOrders.length;
      const revenueYTD = yearOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
      const avgDealSizeMTD = unitsSoldMTD > 0 ? revenueMTD / unitsSoldMTD : 0;
      const cashCollectedMTD = cashCollectedMTDAgg._sum.totalPrice || 0;

      // Daily MTD revenue trend — cumulative actual booked so far each day,
      // plus the straight-line pace a flat month would need to hit the
      // company target (a reference line, not a forecast) so leadership can
      // see at a glance whether today's cumulative is ahead or behind.
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysElapsed = now.getDate();
      const dailyRevenue = new Array(daysElapsed).fill(0);
      for (const o of mtdOrders) {
        const dayIndex = o.orderDate.getDate() - 1;
        if (dayIndex >= 0 && dayIndex < daysElapsed) dailyRevenue[dayIndex] += o.totalPrice || 0;
      }
      let cumulative = 0;
      const dailyTrend = dailyRevenue.map((rev, i) => {
        cumulative += rev;
        return {
          day: i + 1,
          label: String(i + 1),
          cumulativeRevenue: cumulative,
          pace: companyTarget && companyTarget.revenueTarget > 0 ? Math.round((companyTarget.revenueTarget / daysInMonth) * (i + 1)) : null,
        };
      });

      const inventoryUnits = activeVehicles.reduce((s, v) => s + v.stock, 0);
      const inventoryValue = activeVehicles.reduce((s, v) => s + v.stock * (v.finalPrice ?? v.basePrice), 0);
      const avgDailyUnitsSold30d = last30dBookedCount / 30;
      const daysSalesOfInventory = avgDailyUnitsSold30d > 0 ? Math.round(inventoryUnits / avgDailyUnitsSold30d) : null;

      const underReviewWarrantyClaims = warrantyClaimsByStatusRaw.find((w) => w.status === 'UNDER_REVIEW')?._count ?? 0;

      const risks = [
        overdueJobCards > 0 && {
          id: 'overdue-job-cards',
          label: `${overdueJobCards} overdue job card${overdueJobCards === 1 ? '' : 's'} (3+ days)`,
          severity: 'serious' as const,
          href: '/admin/workshop/job-cards',
        },
        staleUnpaidOrders > 0 && {
          id: 'stale-unpaid',
          label: `${staleUnpaidOrders} order${staleUnpaidOrders === 1 ? '' : 's'} unpaid 7+ days`,
          severity: 'critical' as const,
          href: '/admin/orders',
        },
        pendingDiscountApprovals > 0 && {
          id: 'discount-approvals',
          label: `${pendingDiscountApprovals} discount approval${pendingDiscountApprovals === 1 ? '' : 's'} awaiting sign-off`,
          severity: 'warning' as const,
          href: '/admin/quotations',
        },
        underReviewWarrantyClaims > 0 && {
          id: 'warranty-review',
          label: `${underReviewWarrantyClaims} warranty claim${underReviewWarrantyClaims === 1 ? '' : 's'} under review`,
          severity: 'serious' as const,
          href: '/admin/workshop/warranty-claims',
        },
        partsBelowReorder > 0 && {
          id: 'parts-reorder',
          label: `${partsBelowReorder} part${partsBelowReorder === 1 ? '' : 's'} below reorder level`,
          severity: 'warning' as const,
          href: '/admin/parts',
        },
        staleQuotations > 0 && {
          id: 'stale-quotations',
          label: `${staleQuotations} new lead${staleQuotations === 1 ? '' : 's'} untouched 3+ days`,
          severity: 'warning' as const,
          href: '/admin/quotations',
        },
        unreadMessages > 0 && {
          id: 'unread-messages',
          label: `${unreadMessages} unread customer message${unreadMessages === 1 ? '' : 's'}`,
          severity: 'warning' as const,
          href: '/admin/messages',
        },
      ].filter((r): r is { id: string; label: string; severity: 'critical' | 'serious' | 'warning'; href: string } => Boolean(r));

      leadership = {
        kpis: {
          revenueMTD,
          revenueMTDTargetPct: companyTarget && companyTarget.revenueTarget > 0 ? Math.round((revenueMTD / companyTarget.revenueTarget) * 100) : null,
          revenueYTD,
          unitsSoldMTD,
          unitsSoldMTDTargetPct: companyTarget && companyTarget.unitsTarget > 0 ? Math.round((unitsSoldMTD / companyTarget.unitsTarget) * 100) : null,
          avgDealSizeMTD,
          conversionRate: totalQuotations > 0 ? Math.round((totalOrdersAllStatuses / totalQuotations) * 100) : 0,
          avgRating: avgRatingAgg._avg.rating || 0,
        },
        monthlyTarget: companyTarget
          ? { month: currentMonthStr, revenueTarget: companyTarget.revenueTarget, unitsTarget: companyTarget.unitsTarget }
          : null,
        dailyTrend,
        revenueByShowroom,
        salesMixByModel,
        quarterlyRevenue,
        financialSnapshot: {
          receivablesOutstanding: (unpaidSumAgg._sum.totalPrice || 0) + (pendingReviewSumAgg._sum.totalPrice || 0),
          receivablesAgedOver60d: receivablesAgedAgg._sum.totalPrice || 0,
          inventoryValue,
          inventoryUnits,
          daysSalesOfInventory,
          cashCollectedMTD,
          cashCollectedMTDPctOfRevenue: revenueMTD > 0 ? Math.round((cashCollectedMTD / revenueMTD) * 100) : null,
        },
        risks,
      };
    }

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
      leadership,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const SHOWROOM_VISIT_STATUS_LABELS: Record<string, string> = {
  started: 'Started',
  registered: 'Registered',
  quote: 'Requested Quote',
  'test-drive': 'Test Drive Booked',
  purchase: 'Purchase Inquiry',
};

// GET /api/analytics/sales-dashboard — the daily operational dashboard every
// staff member (not just executives) lands on: today's quote/order/payment
// counts, this month's pace against the company-wide SalesTarget, today's
// logged marketing activities, and today's showroom visitors/walk-ins.
// Deliberately not executive-gated — see the leadership block's own comment
// above for why company financials ARE gated; this is today's operational
// counts, the same sensitivity level as the rest of GET /api/analytics.
router.get('/sales-dashboard', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [
      quotedToday, orderedToday, paidTodayAgg, paidTodayCount,
      monthOrders, companyTarget,
      todayVisits, todayWalkIns,
    ] = await Promise.all([
      prisma.quotation.findMany({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } }, select: { unitPrice: true, quantity: true } }),
      prisma.salesOrder.aggregate({
        _sum: { totalPrice: true },
        _count: true,
        where: { orderDate: { gte: startOfToday, lt: startOfTomorrow }, status: { not: 'CANCELLED' } },
      }),
      prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { paymentConfirmedAt: { gte: startOfToday, lt: startOfTomorrow } } }),
      prisma.salesOrder.count({ where: { paymentConfirmedAt: { gte: startOfToday, lt: startOfTomorrow } } }),
      prisma.salesOrder.findMany({
        where: { status: { not: 'CANCELLED' }, orderDate: { gte: startOfMonth, lt: startOfNextMonth } },
        select: { totalPrice: true },
      }),
      prisma.salesTarget.findFirst({ where: { month: currentMonthStr, dealerId: null } }),
      prisma.showroomVisit.findMany({
        where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, status: true, quotationId: true, createdAt: true },
      }),
      prisma.walkInRegistration.findMany({
        where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } },
        orderBy: { createdAt: 'desc' },
        include: { registeredBy: { select: { name: true } } },
      }),
    ]);

    const quotedValue = quotedToday.reduce((s, q) => s + (q.unitPrice || 0) * (q.quantity || 1), 0);
    const orderedCount = orderedToday._count;
    const orderedValue = orderedToday._sum.totalPrice || 0;
    const paidCount = paidTodayCount;
    const paidValue = paidTodayAgg._sum.totalPrice || 0;
    // Same-day metric, matching how the Sales Dashboard frames it: of
    // TODAY's new quotes, how many are already paid today — not a claim
    // that today's payments came from today's quotes.
    const quoteToPaidConversionPct = quotedToday.length > 0 ? Math.round((paidCount / quotedToday.length) * 100) : 0;

    const unitsAchieved = monthOrders.length;
    const revenueAchieved = monthOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();

    // Resolve "Model Interest" for showroom visits that made it to a
    // quotation — WalkInRegistration already carries its own vehicleInterest
    // field directly, so only ShowroomVisit needs this extra lookup.
    const visitQuotationIds = todayVisits.map((v) => v.quotationId).filter((id): id is string => !!id);
    const linkedQuotations = visitQuotationIds.length
      ? await prisma.quotation.findMany({ where: { id: { in: visitQuotationIds } }, select: { id: true, vehicleModel: true } })
      : [];
    const quotationModelMap = new Map(linkedQuotations.map((q) => [q.id, q.vehicleModel]));

    const visitors = [
      ...todayVisits.map((v) => ({
        id: v.id,
        name: v.fullName || 'Unnamed visitor',
        modelInterest: (v.quotationId && quotationModelMap.get(v.quotationId)) || null,
        rep: null as string | null, // self-service QR check-in, no staff involved
        status: SHOWROOM_VISIT_STATUS_LABELS[v.status] || v.status,
        source: 'qr' as const,
        createdAt: v.createdAt,
      })),
      ...todayWalkIns.map((w) => ({
        id: w.id,
        name: w.customerName,
        modelInterest: w.vehicleInterest,
        rep: w.registeredBy.name,
        status: 'Walk-in (Registered)',
        source: 'walk-in' as const,
        createdAt: w.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json({
      today: {
        quoted: { count: quotedToday.length, value: quotedValue },
        ordered: { count: orderedCount, value: orderedValue },
        paid: { count: paidCount, value: paidValue },
        quoteToPaidConversionPct,
      },
      targetVsPlan: companyTarget
        ? {
            month: currentMonthStr,
            unitsTarget: companyTarget.unitsTarget,
            unitsAchieved,
            revenueTarget: companyTarget.revenueTarget,
            revenueAchieved,
            daysElapsed,
            daysInMonth,
          }
        : null,
      visitorsToday: visitors,
    });
  } catch (error) {
    console.error('Sales dashboard error:', error);
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
