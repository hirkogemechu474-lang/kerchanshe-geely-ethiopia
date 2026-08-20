import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Post-visit satisfaction survey (BRD FR-602, UC-16). No login required —
// the job card's own id (a random UUID, never shown to any customer other
// than in this emailed link) is the access token. One response per job
// card: CSISurveyResponse.jobCardId is unique, so a resubmission attempt is
// rejected rather than overwriting the original.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobCardId: string }> }) {
  const { jobCardId } = await params;

  const jobCard = await prisma.jobCard.findUnique({
    where: { id: jobCardId },
    select: {
      id: true,
      jobCardNo: true,
      vehicleModel: true,
      customerName: true,
      status: true,
      csiSurveyResponse: { select: { id: true } },
    },
  });

  if (!jobCard) {
    return NextResponse.json({ eligible: false, reason: 'not_found' }, { status: 404 });
  }

  if (jobCard.status !== 'INVOICED_CLOSED') {
    return NextResponse.json({ eligible: false, reason: 'not_closed' });
  }

  if (jobCard.csiSurveyResponse) {
    return NextResponse.json({ eligible: false, reason: 'already_submitted' });
  }

  return NextResponse.json({
    eligible: true,
    jobCardNo: jobCard.jobCardNo,
    vehicleModel: jobCard.vehicleModel,
    customerName: jobCard.customerName,
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ jobCardId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.csiSurvey);
  if (rateLimitResult) return rateLimitResult;

  const { jobCardId } = await params;
  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === 'string' ? body.comment.slice(0, 1000) : null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be a whole number between 1 and 5' }, { status: 400 });
  }

  const jobCard = await prisma.jobCard.findUnique({
    where: { id: jobCardId },
    select: { id: true, status: true },
  });

  if (!jobCard) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
  }

  if (jobCard.status !== 'INVOICED_CLOSED') {
    return NextResponse.json({ error: 'This job card is not yet closed' }, { status: 400 });
  }

  try {
    await prisma.cSISurveyResponse.create({
      data: { jobCardId, rating, comment },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A response has already been submitted for this visit' }, { status: 409 });
    }
    console.error('[csi-survey] submit failed', error);
    return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
