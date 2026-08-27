import { prisma } from '@/lib/prisma';
import { isOverdue } from './jobCardStateMachine';

// Shared aggregation behind both the Workshop Live Dashboard
// (app/api/admin/workshop/dashboard) and the unified admin Dashboard
// (app/api/admin/analytics) so the two never drift on how a KPI is computed.
export async function getWorkshopSummary() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [bays, jobsToday, pendingApproval, closedToday, openJobCards, activeSpareParts, claimsByStatus] =
    await Promise.all([
      prisma.serviceBay.findMany({
        where: { isActive: true },
        include: {
          jobCards: {
            where: { status: { notIn: ['CANCELLED', 'INVOICED_CLOSED'] } },
            select: { id: true, jobCardNo: true, customerName: true, status: true },
            take: 1,
          },
        },
        orderBy: [{ bayType: 'asc' }, { name: 'asc' }],
      }),
      prisma.jobCard.count({ where: { openTs: { gte: todayStart, lte: todayEnd } } }),
      prisma.jobCard.count({ where: { status: 'AWAITING_APPROVAL' } }),
      prisma.jobCard.findMany({
        where: { closeTs: { gte: todayStart, lte: todayEnd }, status: 'INVOICED_CLOSED' },
        select: { openTs: true, closeTs: true },
      }),
      prisma.jobCard.findMany({
        where: { status: { notIn: ['CANCELLED', 'INVOICED_CLOSED'] } },
        select: {
          id: true,
          jobCardNo: true,
          plateNo: true,
          vehicleModel: true,
          customerName: true,
          status: true,
          openTs: true,
          technician: { select: { name: true } },
          bay: { select: { name: true } },
        },
        orderBy: { openTs: 'desc' },
        take: 50,
      }),
      prisma.sparePart.findMany({ where: { isActive: true }, select: { stock: true, reorderPoint: true } }),
      prisma.warrantyClaim.groupBy({ by: ['status'], _count: true }),
    ]);

  const busyBays = bays.filter((b) => b.status === 'OCCUPIED').length;
  const partsBelowReorder = activeSpareParts.filter((p) => p.stock <= p.reorderPoint).length;

  const avgTurnaroundMinutes =
    closedToday.length > 0
      ? Math.round(
          closedToday.reduce((sum, j) => sum + (j.closeTs!.getTime() - j.openTs.getTime()), 0) /
            closedToday.length /
            60000
        )
      : null;

  const overdueCount = openJobCards.filter((j) => isOverdue(j.openTs, j.status)).length;

  return {
    kpis: {
      baysBusy: busyBays,
      baysTotal: bays.length,
      jobsToday,
      avgTurnaroundMinutes,
      pendingApproval,
      overdueCount,
      partsBelowReorder,
    },
    warrantyClaimsByStatus: claimsByStatus.map((c) => ({ status: c.status, count: c._count })),
    bays: bays.map((b) => ({
      id: b.id,
      name: b.name,
      bayType: b.bayType,
      status: b.status,
      currentJobCard: b.jobCards[0] || null,
    })),
    jobCards: openJobCards.map((j) => ({
      ...j,
      technicianName: j.technician?.name || null,
      bayName: j.bay?.name || null,
      isOverdue: isOverdue(j.openTs, j.status),
    })),
    generatedAt: new Date().toISOString(),
  };
}
