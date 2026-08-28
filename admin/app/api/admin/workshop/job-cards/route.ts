import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listJobCards, createJobCard } from '@/lib/services/workshop/jobCardService';
import type { JobCardStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as JobCardStatus | null;
  const technicianId = searchParams.get('technicianId');
  const bayId = searchParams.get('bayId');
  const date = searchParams.get('date'); // YYYY-MM-DD, filters by openTs day

  const jobCards = await listJobCards({ status, technicianId, bayId, date });

  return NextResponse.json({ jobCards });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const result = await createJobCard(body, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ jobCard: result.jobCard }, { status: 201 });
}
