import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { isOverdue } from '@/lib/workshop/jobCardStateMachine';

// Workshop Live Dashboard (BRD Screen 1 / FR-701): bays busy/total, jobs
// today, average turnaround, pending-approval count, bay tiles, today's job
// list. Modeled after the existing app/api/admin/analytics Promise.all
// pattern — no separate aggregation-service layer in this codebase.
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [bays, jobsToday, pendingApproval, closedToday, openJobCards, activeSpareParts] = await Promise.all([
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
  ]);

  const busyBays = bays.filter((b) => b.status === 'OCCUPIED').length;
  // FR-403: live-computed, not pushed — see docs/SWMS-INTEGRATION-BACKLOG.md.
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

  return NextResponse.json({
    baysBusy: busyBays,
    baysTotal: bays.length,
    jobsToday,
    avgTurnaroundMinutes,
    pendingApproval,
    overdueCount,
    partsBelowReorder,
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
  });
}
