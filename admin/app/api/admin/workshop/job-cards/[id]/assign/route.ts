import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { assignJobCard } from '@/lib/services/workshop/jobCardService';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { technicianId, bayId, scheduledStart, scheduledEnd } = body as {
    technicianId?: string | null;
    bayId?: string | null;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
  };

  const result = await assignJobCard(id, { technicianId, bayId, scheduledStart, scheduledEnd });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ jobCard: result.jobCard });
}
