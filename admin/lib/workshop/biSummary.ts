import { prisma } from '@/lib/prisma';

// Management BI Dashboard (BRD Screen 8 / FR-702–704): monthly workshop KPIs
// computed over closed job cards and resolved warranty claims for a given
// calendar month. Deliberately separate from lib/workshop/dashboardSummary.ts
// (the live operational snapshot) — this module answers "how did last month
// go", not "what does the floor look like right now".
//
// Scope decisions (see docs/SWMS-INTEGRATION-BACKLOG.md before extending):
// - First-time-fix is inferred from the QC-fail rework loop (a
//   QUALITY_CONTROL -> IN_PROGRESS transition in JobCardStatusHistory) since
//   no dedicated "repeat repair" flag exists on JobCard.
// - Revenue mix is bucketed by JobCard.isWarrantyOrGoodwill, since no
//   service-type/category field exists on JobCard yet.
// - CSI is computed from real CSISurveyResponse rows once any exist for the
//   month; until a customer actually responds, it's reported as unavailable
//   rather than fabricated as a zero/blank average (see the backlog).

export interface BiPeriod {
  from: Date;
  to: Date;
  label: string;
  monthValue: string; // YYYY-MM, echoed back so the UI can round-trip it
}

/** Resolves a `YYYY-MM` query param to a calendar-month period, defaulting to the current month. */
export function resolveMonthPeriod(monthParam?: string | null): BiPeriod {
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth(); // 0-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      monthIndex = m - 1;
    }
  }

  const from = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const to = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const label = from.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const monthValue = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  return { from, to, label, monthValue };
}

export async function getWorkshopBiSummary(period: BiPeriod) {
  const { from, to } = period;

  const [closedJobs, reworkHistory, resolvedClaimHistory, csiResponses] = await Promise.all([
    prisma.jobCard.findMany({
      where: { status: 'INVOICED_CLOSED', closeTs: { gte: from, lte: to } },
      select: {
        id: true,
        openTs: true,
        closeTs: true,
        invoiceAmount: true,
        estimateAmount: true,
        isWarrantyOrGoodwill: true,
      },
    }),
    prisma.jobCardStatusHistory.findMany({
      where: {
        fromStatus: 'QUALITY_CONTROL',
        toStatus: 'IN_PROGRESS',
        jobCard: { status: 'INVOICED_CLOSED', closeTs: { gte: from, lte: to } },
      },
      select: { jobCardId: true },
    }),
    prisma.warrantyClaimStatusHistory.findMany({
      where: {
        toStatus: { in: ['APPROVED', 'REJECTED'] },
        changedAt: { gte: from, lte: to },
        claim: { submittedAt: { not: null } },
      },
      select: { toStatus: true, changedAt: true, claim: { select: { submittedAt: true } } },
    }),
    prisma.cSISurveyResponse.findMany({
      where: { submittedAt: { gte: from, lte: to } },
      select: { rating: true },
    }),
  ]);

  const reworkedJobIds = new Set(reworkHistory.map((h) => h.jobCardId));
  const jobsClosedCount = closedJobs.length;
  const firstTimeFixCount = closedJobs.filter((j) => !reworkedJobIds.has(j.id)).length;
  const firstTimeFixRate =
    jobsClosedCount > 0 ? Math.round((firstTimeFixCount / jobsClosedCount) * 1000) / 10 : null;

  const avgTurnaroundHours =
    jobsClosedCount > 0
      ? Math.round(
          (closedJobs.reduce((sum, j) => sum + (j.closeTs!.getTime() - j.openTs.getTime()), 0) /
            jobsClosedCount /
            3_600_000) *
            10
        ) / 10
      : null;

  const revenue = closedJobs.reduce(
    (acc, j) => {
      const amount = j.invoiceAmount ?? j.estimateAmount ?? 0;
      if (j.isWarrantyOrGoodwill) acc.warrantyGoodwill += amount;
      else acc.standard += amount;
      acc.total += amount;
      return acc;
    },
    { standard: 0, warrantyGoodwill: 0, total: 0 }
  );

  const turnaroundDays = resolvedClaimHistory.map(
    (h) => (h.changedAt.getTime() - h.claim.submittedAt!.getTime()) / 86_400_000
  );
  const avgWarrantyTurnaroundDays =
    turnaroundDays.length > 0
      ? Math.round((turnaroundDays.reduce((a, b) => a + b, 0) / turnaroundDays.length) * 10) / 10
      : null;

  return {
    period: { from: from.toISOString(), to: to.toISOString(), label: period.label, monthValue: period.monthValue },
    kpis: {
      jobsClosedCount,
      firstTimeFixRate,
      avgTurnaroundHours,
      avgWarrantyTurnaroundDays,
      claimsResolved: resolvedClaimHistory.length,
      claimsApproved: resolvedClaimHistory.filter((h) => h.toStatus === 'APPROVED').length,
      claimsRejected: resolvedClaimHistory.filter((h) => h.toStatus === 'REJECTED').length,
    },
    revenue,
    csi:
      csiResponses.length > 0
        ? {
            available: true,
            averageRating: Math.round((csiResponses.reduce((sum, r) => sum + r.rating, 0) / csiResponses.length) * 100) / 100,
            responseCount: csiResponses.length,
          }
        : {
            available: false,
            reason: 'No survey responses received yet this month.',
          },
    generatedAt: new Date().toISOString(),
  };
}

export type WorkshopBiSummary = Awaited<ReturnType<typeof getWorkshopBiSummary>>;
