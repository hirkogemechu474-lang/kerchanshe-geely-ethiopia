import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { showroomVisitRepository } from '@/repositories/showroomVisitRepository';
import { ALLOWED_VISIT_ACTIONS } from '@/lib/services/showroomVisits/showroomVisitService';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.showroomVisitRegister);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const visit = await showroomVisitRepository.findSummaryById(id);
  if (!visit) {
    return NextResponse.json({ error: 'Visit session not found' }, { status: 404 });
  }
  return NextResponse.json(visit);
}

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

  if (!ALLOWED_VISIT_ACTIONS.includes(selectedAction)) {
    return NextResponse.json({ error: 'Invalid selectedAction' }, { status: 400 });
  }

  const existing = await showroomVisitRepository.findById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Visit session not found' }, { status: 404 });
  }

  const visit = await showroomVisitRepository.updateSelectedAction(id, selectedAction, testDriveId);

  return NextResponse.json({ visitId: visit.id, status: visit.status });
}
