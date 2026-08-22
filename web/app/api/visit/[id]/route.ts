import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.showroomVisitRegister);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const visit = await prisma.showroomVisit.findUnique({
    where: { id },
    select: { id: true, status: true, fullName: true, phone: true, email: true },
  });
  if (!visit) {
    return NextResponse.json({ error: 'Visit session not found' }, { status: 404 });
  }
  return NextResponse.json(visit);
}

const ALLOWED_ACTIONS = ['sales', 'test-drive', 'purchase', 'quote'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.showroomVisitRegister);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const selectedAction = typeof body?.selectedAction === 'string' ? body.selectedAction : '';
  // Loose links back to whichever CRM record this action produced — see
  // web/app/api/quotations/route.ts and .../purchases/route.ts for the
  // quotation/purchase equivalents, set directly by those routes instead.
  const testDriveId = typeof body?.testDriveId === 'string' && body.testDriveId ? body.testDriveId : undefined;

  if (!ALLOWED_ACTIONS.includes(selectedAction)) {
    return NextResponse.json({ error: 'Invalid selectedAction' }, { status: 400 });
  }

  const existing = await prisma.showroomVisit.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Visit session not found' }, { status: 404 });
  }

  const visit = await prisma.showroomVisit.update({
    where: { id },
    data: {
      status: selectedAction,
      selectedAction,
      completedAt: new Date(),
      ...(testDriveId && { testDriveId }),
    },
  });

  return NextResponse.json({ visitId: visit.id, status: visit.status });
}
