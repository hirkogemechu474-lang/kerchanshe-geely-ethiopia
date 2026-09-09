import { prisma } from '../../config/database';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Resolves a `YYYY-MM` query param (or the current month if missing/invalid) to a
// [start, end) date range plus display fields, shared by the /bi-dashboard and
// /bi-dashboard/trend routes so "what counts as the month" can't drift between them.
export function resolveBiMonthRange(monthParam?: string | null): { start: Date; end: Date; monthValue: string; label: string } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-12

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
    monthValue: `${year}-${String(month).padStart(2, '0')}`,
    label: `${MONTH_LABELS[month - 1]} ${year}`,
  };
}

export interface WorkshopBiMetrics {
  kpis: {
    jobsClosedCount: number;
    firstTimeFixRate: number | null;
    avgTurnaroundHours: number | null;
    avgWarrantyTurnaroundDays: number | null;
    claimsResolved: number;
    claimsApproved: number;
    claimsRejected: number;
  };
  revenue: { standard: number; warrantyGoodwill: number; total: number };
  csi: { available: true; averageRating: number; responseCount: number } | { available: false; reason: string };
}

// Core KPI computation for a single [start, end) window. Used by both the
// /bi-dashboard route (one month) and /bi-dashboard/trend route (N months, one
// call per month) so their numbers can never disagree on how a metric is derived.
export async function computeWorkshopBiMetrics(start: Date, end: Date): Promise<WorkshopBiMetrics> {
  const closedJobCards = await prisma.jobCard.findMany({
    where: { status: 'INVOICED_CLOSED', closeTs: { gte: start, lt: end } },
    select: { id: true, openTs: true, closeTs: true, invoiceAmount: true, isWarrantyOrGoodwill: true },
  });
  const jobsClosedCount = closedJobCards.length;

  let avgTurnaroundHours: number | null = null;
  let revenueStandard = 0;
  let revenueWarrantyGoodwill = 0;
  if (jobsClosedCount > 0) {
    const totalHours = closedJobCards.reduce(
      (sum, jc) => sum + (jc.closeTs!.getTime() - jc.openTs.getTime()) / (1000 * 60 * 60),
      0
    );
    avgTurnaroundHours = Math.round((totalHours / jobsClosedCount) * 10) / 10;

    for (const jc of closedJobCards) {
      const amount = jc.invoiceAmount ?? 0;
      if (jc.isWarrantyOrGoodwill) revenueWarrantyGoodwill += amount;
      else revenueStandard += amount;
    }
  }

  // First-time-fix definition: a closed job card "required rework" if it entered
  // the QUALITY_CONTROL status more than once in its statusHistory (i.e. it failed
  // QC and was cycled back through IN_PROGRESS before eventually passing). We use
  // statusHistory rather than the `qcPassed` column because `qcPassed` only holds
  // the latest value and can't tell us how many QC attempts a job card went through.
  let firstTimeFixRate: number | null = null;
  if (jobsClosedCount > 0) {
    const qcEntries = await prisma.jobCardStatusHistory.groupBy({
      by: ['jobCardId'],
      where: { jobCardId: { in: closedJobCards.map((jc) => jc.id) }, toStatus: 'QUALITY_CONTROL' },
      _count: true,
    });
    const reworkedCount = qcEntries.filter((e) => (e._count as any) > 1).length;
    firstTimeFixRate = Math.round(((jobsClosedCount - reworkedCount) / jobsClosedCount) * 1000) / 10;
  }

  // Warranty claims "resolved" in the period are keyed off `updatedAt` (no
  // dedicated resolvedAt column exists). REIMBURSED is counted as approved — a
  // claim can only be reimbursed after having been approved.
  const resolvedClaims = await prisma.warrantyClaim.findMany({
    where: { status: { in: ['APPROVED', 'REJECTED', 'REIMBURSED'] }, updatedAt: { gte: start, lt: end } },
    select: { status: true, createdAt: true, updatedAt: true },
  });
  const claimsApproved = resolvedClaims.filter((c) => c.status === 'APPROVED' || c.status === 'REIMBURSED').length;
  const claimsRejected = resolvedClaims.filter((c) => c.status === 'REJECTED').length;
  const claimsResolved = claimsApproved + claimsRejected;

  let avgWarrantyTurnaroundDays: number | null = null;
  if (resolvedClaims.length > 0) {
    const totalDays = resolvedClaims.reduce(
      (sum, c) => sum + (c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      0
    );
    avgWarrantyTurnaroundDays = Math.round((totalDays / resolvedClaims.length) * 10) / 10;
  }

  const csiResponses = await prisma.cSISurveyResponse.findMany({
    where: { submittedAt: { gte: start, lt: end } },
    select: { rating: true },
  });
  const csi: WorkshopBiMetrics['csi'] = csiResponses.length > 0
    ? {
        available: true,
        averageRating: Math.round((csiResponses.reduce((sum, r) => sum + r.rating, 0) / csiResponses.length) * 100) / 100,
        responseCount: csiResponses.length,
      }
    : { available: false, reason: 'No customer satisfaction responses recorded for this period.' };

  return {
    kpis: {
      jobsClosedCount,
      firstTimeFixRate,
      avgTurnaroundHours,
      avgWarrantyTurnaroundDays,
      claimsResolved,
      claimsApproved,
      claimsRejected,
    },
    revenue: { standard: revenueStandard, warrantyGoodwill: revenueWarrantyGoodwill, total: revenueStandard + revenueWarrantyGoodwill },
    csi,
  };
}

export const biSummaryService = {
  async getWorkshopBiSummary(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalJobCards,
        openJobCards,
        completedThisMonth,
        totalRevenue,
        avgCompletionTime,
      ] = await Promise.all([
        prisma.jobCard.count(),
        prisma.jobCard.count({
          where: { status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] } },
        }),
        prisma.jobCard.count({
          where: {
            status: 'INVOICED_CLOSED',
            closeTs: { gte: startOfMonth },
          },
        }),
        prisma.jobCard.aggregate({
          where: { status: 'INVOICED_CLOSED' },
          _sum: { invoiceAmount: true },
        }),
        prisma.jobCard.findMany({
          where: {
            status: 'INVOICED_CLOSED',
            closeTs: { not: null },
          },
          select: { openTs: true, closeTs: true },
          take: 100,
          orderBy: { closeTs: 'desc' },
        }),
      ]);

      let avgDays = 0;
      if (avgCompletionTime.length > 0) {
        const totalDays = avgCompletionTime.reduce((sum, jc) => {
          const diff = jc.closeTs!.getTime() - jc.openTs.getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0);
        avgDays = totalDays / avgCompletionTime.length;
      }

      return {
        ok: true,
        data: {
          totalJobCards,
          openJobCards,
          completedThisMonth,
          totalRevenue: totalRevenue._sum?.invoiceAmount ?? 0,
          avgCompletionDays: Math.round(avgDays * 10) / 10,
        },
      };
    } catch (error: any) {
      console.error('[BI SUMMARY ERROR]', error.message);
      return { ok: false, error: 'Failed to generate BI summary.' };
    }
  },
};
