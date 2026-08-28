import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { transitionJobCardStatus } from '@/lib/services/workshop/jobCardService';
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

  const result = await transitionJobCardStatus(id, toStatus, reasonCode, qcPassed, qcNotes, session!.user.id, {
    canManageJobCards: session!.user.permissions.canManageJobCards,
    canPerformQC: session!.user.permissions.canPerformQC,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ jobCard: result.jobCard, notification: result.notification, csiSurveyInvite: result.csiSurveyInvite });
}
