import { prisma } from '../../config/database';

export const dashboardService = {
  /**
   * Get comprehensive CRM dashboard with pipeline, conversion, and performance metrics.
   */
  async getCRMDashboard(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Lead pipeline counts
      const [totalLeads, newLeads, qualifiedLeads, convertingLeads] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'new' } }),
        prisma.lead.count({ where: { status: 'qualified' } }),
        prisma.lead.count({ where: { status: 'converting' } }),
      ]);

      // Quotation pipeline
      const [totalQuotations, pendingQuotations, approvedQuotations, sentQuotations] = await Promise.all([
        prisma.quotation.count(),
        prisma.quotation.count({ where: { managerApprovalStatus: 'PENDING' } }),
        prisma.quotation.count({ where: { managerApprovalStatus: 'APPROVED' } }),
        prisma.quotation.count({ where: { status: 'sent' } }),
      ]);

      // Order pipeline
      const [totalOrders, quotedOrders, bookedOrders, financingOrders, readyOrders, deliveredOrders, cancelledOrders] = await Promise.all([
        prisma.salesOrder.count(),
        prisma.salesOrder.count({ where: { status: 'QUOTED' } }),
        prisma.salesOrder.count({ where: { status: 'BOOKED' } }),
        prisma.salesOrder.count({ where: { status: 'FINANCING_PENDING' } }),
        prisma.salesOrder.count({ where: { status: 'READY_FOR_DELIVERY' } }),
        prisma.salesOrder.count({ where: { status: 'DELIVERED' } }),
        prisma.salesOrder.count({ where: { status: 'CANCELLED' } }),
      ]);

      // Revenue metrics (last 30 days and 90 days)
      const [revenue30d, revenue90d, totalRevenue] = await Promise.all([
        prisma.salesOrder.aggregate({
          where: { status: 'DELIVERED', deliveredAt: { gte: thirtyDaysAgo } },
          _sum: { totalPrice: true },
          _count: true,
        }),
        prisma.salesOrder.aggregate({
          where: { status: 'DELIVERED', deliveredAt: { gte: ninetyDaysAgo } },
          _sum: { totalPrice: true },
          _count: true,
        }),
        prisma.salesOrder.aggregate({
          where: { status: 'DELIVERED' },
          _sum: { totalPrice: true },
          _count: true,
        }),
      ]);

      // Conversion rates
      const leadToQuotation = totalLeads > 0 ? Math.round((totalQuotations / totalLeads) * 100) : 0;
      const quotationToOrder = totalQuotations > 0 ? Math.round((totalOrders / totalQuotations) * 100) : 0;
      const orderToDelivery = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

      // Agent performance
      const agentPerformance = await prisma.salesOrder.groupBy({
        by: ['salesAgentId'],
        where: { salesAgentId: { not: null } },
        _count: true,
        _sum: { totalPrice: true, commissionAmount: true },
      });

      const agents = await Promise.all(
        agentPerformance.map(async (ap) => {
          const user = ap.salesAgentId ? await prisma.user.findUnique({
            where: { id: ap.salesAgentId },
            select: { name: true, email: true },
          }) : null;
          return {
            agentId: ap.salesAgentId,
            agentName: user?.name || 'Unknown',
            ordersCount: ap._count,
            totalRevenue: ap._sum.totalPrice || 0,
            totalCommission: ap._sum.commissionAmount || 0,
          };
        })
      );

      // Financing pipeline
      const [pendingFinancing, approvedFinancing, declinedFinancing] = await Promise.all([
        prisma.financingApplication.count({ where: { status: { in: ['PENDING', 'DOCUMENTS_REQUIRED', 'SUBMITTED', 'UNDER_REVIEW'] } } }),
        prisma.financingApplication.count({ where: { status: 'APPROVED' } }),
        prisma.financingApplication.count({ where: { status: 'DECLINED' } }),
      ]);

      // Trade-in metrics
      const [pendingTradeIns, approvedTradeIns] = await Promise.all([
        prisma.tradeInEvaluation.count({ where: { approvalStatus: 'PENDING' } }),
        prisma.tradeInEvaluation.count({ where: { approvalStatus: 'APPROVED' } }),
      ]);

      // SLA compliance
      let slaCompliance = 100;
      try {
        const slaResult = await prisma.$queryRaw<any[]>`
          SELECT
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
            COUNT(*) FILTER (WHERE status = 'BREACHED') as breached
          FROM "SLATimer"
        `;
        if (slaResult && slaResult.length > 0) {
          const completed = parseInt(slaResult[0].completed) || 0;
          const breached = parseInt(slaResult[0].breached) || 0;
          slaCompliance = completed + breached > 0 ? Math.round((completed / (completed + breached)) * 100) : 100;
        }
      } catch {
        // SLATimer table may not exist yet
      }

      return {
        ok: true,
        data: {
          pipeline: {
            leads: { total: totalLeads, new: newLeads, qualified: qualifiedLeads, converting: convertingLeads },
            quotations: { total: totalQuotations, pending: pendingQuotations, approved: approvedQuotations, sent: sentQuotations },
            orders: { total: totalOrders, quoted: quotedOrders, booked: bookedOrders, financing: financingOrders, ready: readyOrders, delivered: deliveredOrders, cancelled: cancelledOrders },
          },
          revenue: {
            last30Days: { total: revenue30d._sum.totalPrice || 0, count: revenue30d._count },
            last90Days: { total: revenue90d._sum.totalPrice || 0, count: revenue90d._count },
            allTime: { total: totalRevenue._sum.totalPrice || 0, count: totalRevenue._count },
          },
          conversionRates: {
            leadToQuotation,
            quotationToOrder,
            orderToDelivery,
          },
          agentPerformance: agents.sort((a, b) => b.totalRevenue - a.totalRevenue),
          financing: { pending: pendingFinancing, approved: approvedFinancing, declined: declinedFinancing },
          tradeIns: { pending: pendingTradeIns, approved: approvedTradeIns },
          slaCompliance,
        },
      };
    } catch (error: any) {
      console.error('[CRM DASHBOARD ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch CRM dashboard.' };
    }
  },

  /**
   * Get sales agent performance report.
   */
  async getAgentPerformance(params: {
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = {};
      if (params.agentId) where.salesAgentId = params.agentId;
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = params.startDate;
        if (params.endDate) where.createdAt.lte = params.endDate;
      }

      const orders = await prisma.salesOrder.findMany({
        where,
        select: {
          id: true,
          orderNo: true,
          salesAgentId: true,
          totalPrice: true,
          status: true,
          commissionStatus: true,
          commissionAmount: true,
          createdAt: true,
          deliveredAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by agent
      const byAgent: Record<string, any> = {};
      for (const order of orders) {
        const agentId = order.salesAgentId || 'unassigned';
        if (!byAgent[agentId]) {
          byAgent[agentId] = {
            agentId,
            totalOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            totalCommission: 0,
            earnedCommission: 0,
            avgDeliveryDays: 0,
          };
        }
        byAgent[agentId].totalOrders++;
        if (order.status === 'DELIVERED') {
          byAgent[agentId].deliveredOrders++;
          byAgent[agentId].totalRevenue += order.totalPrice || 0;
        }
        if (order.status === 'CANCELLED') byAgent[agentId].cancelledOrders++;
        if (order.commissionStatus === 'EARNED' || order.commissionStatus === 'PAID') {
          byAgent[agentId].earnedCommission += order.commissionAmount || 0;
        }
        byAgent[agentId].totalCommission += order.commissionAmount || 0;
      }

      // Resolve agent names
      const agentIds = Object.keys(byAgent).filter(id => id !== 'unassigned');
      const agents = agentIds.length > 0
        ? await prisma.user.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } })
        : [];
      const agentMap = Object.fromEntries(agents.map(a => [a.id, a.name]));

      for (const [id, data] of Object.entries(byAgent)) {
        data.agentName = agentMap[id] || 'Unassigned';
        data.conversionRate = data.totalOrders > 0 ? Math.round((data.deliveredOrders / data.totalOrders) * 100) : 0;
      }

      return { ok: true, data: Object.values(byAgent) };
    } catch (error: any) {
      console.error('[AGENT PERFORMANCE ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch agent performance.' };
    }
  },

  /**
   * Get lead source analytics.
   */
  async getLeadSourceAnalytics(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bySource = await prisma.lead.groupBy({
        by: ['source'],
        _count: { _all: true },
      });

      const total = bySource.reduce((sum, s) => sum + s._count._all, 0);

      const sources = bySource.map(s => ({
        source: s.source,
        count: s._count._all,
        percentage: total > 0 ? Math.round((s._count._all / total) * 100) : 0,
      }));

      return { ok: true, data: { sources, total } };
    } catch (error: any) {
      console.error('[LEAD SOURCE ANALYTICS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch lead source analytics.' };
    }
  },

  /**
   * Get monthly revenue trend (last 12 months).
   */
  async getRevenueTrend(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const orders = await prisma.salesOrder.findMany({
        where: { status: 'DELIVERED', deliveredAt: { gte: twelveMonthsAgo } },
        select: { totalPrice: true, deliveredAt: true },
      });

      // Group by month
      const monthly: Record<string, { revenue: number; count: number }> = {};
      for (const order of orders) {
        if (!order.deliveredAt) continue;
        const key = `${order.deliveredAt.getFullYear()}-${String(order.deliveredAt.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key]) monthly[key] = { revenue: 0, count: 0 };
        monthly[key].revenue += order.totalPrice || 0;
        monthly[key].count++;
      }

      // Fill in missing months
      const trend = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        trend.push({
          month: key,
          label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
          revenue: monthly[key]?.revenue || 0,
          orders: monthly[key]?.count || 0,
        });
      }

      return { ok: true, data: trend };
    } catch (error: any) {
      console.error('[REVENUE TREND ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch revenue trend.' };
    }
  },
};