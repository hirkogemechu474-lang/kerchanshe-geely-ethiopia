import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { assertTransitionAllowed, JobCardTransitionError } from '@/lib/workshop/jobCardStateMachine';
import { sendJobCardMilestoneNotification } from '@/lib/workshop/customerNotifications';
import { sendCsiSurveyInvite } from '@/lib/workshop/csiSurvey';
import type { JobCardStatus } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const { toStatus, reasonCode, qcPassed, qcNotes } = body as {
    toStatus: JobCardStatus;
    reasonCode?: string;
    qcPassed?: boolean;
    qcNotes?: string;
  };

  if (!toStatus) {
    return NextResponse.json({ error: 'toStatus is required' }, { status: 400 });
  }

  const jobCard = await prisma.jobCard.findUnique({ where: { id } });
  if (!jobCard) {
    return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
  }

  // Any transition OUT of Quality Control records the QC outcome (pass -> the
  // Invoiced/Closed branch, fail -> the In Progress rework branch), so it's
  // gated on the QC permission rather than the general job-card permission.
  const isQcOutcome = jobCard.status === 'QUALITY_CONTROL';
  const requiredPermission = isQcOutcome ? 'canPerformQC' : 'canManageJobCards';
  if (!session!.user.permissions[requiredPermission]) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    assertTransitionAllowed(jobCard.status, toStatus, {
      isWarrantyOrGoodwill: jobCard.isWarrantyOrGoodwill,
      customerApprovedAt: jobCard.customerApprovedAt,
      qcPassed: isQcOutcome ? (qcPassed ?? jobCard.qcPassed) : jobCard.qcPassed,
      complaintText: jobCard.complaintText,
    });
  } catch (err) {
    if (err instanceof JobCardTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.jobCard.update({
      where: { id },
      data: {
        status: toStatus,
        ...(isQcOutcome && qcPassed !== undefined && {
          qcPassed,
          qcNotes: qcNotes || null,
          qcById: session!.user.id,
        }),
        ...(toStatus === 'INVOICED_CLOSED' && { closeTs: new Date() }),
        ...(toStatus === 'CANCELLED' && { closeTs: new Date() }),
      },
    });

    await tx.jobCardStatusHistory.create({
      data: {
        jobCardId: id,
        fromStatus: jobCard.status,
        toStatus,
        changedById: session!.user.id,
        reasonCode: reasonCode || null,
      },
    });

    // Free the bay once the job card leaves the floor.
    if ((toStatus === 'INVOICED_CLOSED' || toStatus === 'CANCELLED') && jobCard.bayId) {
      await tx.serviceBay.update({ where: { id: jobCard.bayId }, data: { status: 'FREE' } });
    }

    return result;
  });

  // FR-601: fire the milestone notification outside the transaction so a
  // slow/misconfigured provider never blocks or rolls back the status
  // change itself. sendJobCardMilestoneNotification never throws.
  const notification = await sendJobCardMilestoneNotification(
    {
      customerEmail: jobCard.customerEmail,
      customerPhone: jobCard.customerPhone,
      customerName: jobCard.customerName,
      jobCardNo: jobCard.jobCardNo,
    },
    jobCard.status,
    toStatus
  );

  // FR-602/UC-16: the CSI survey invite is triggered automatically on
  // closure — never manually by staff — so it lives here, not on a separate
  // staff-facing action.
  const csiSurveyInvite =
    toStatus === 'INVOICED_CLOSED'
      ? await sendCsiSurveyInvite({
          id: jobCard.id,
          jobCardNo: jobCard.jobCardNo,
          customerEmail: jobCard.customerEmail,
          customerName: jobCard.customerName,
        })
      : null;

  return NextResponse.json({ jobCard: updated, notification, csiSurveyInvite });
}
