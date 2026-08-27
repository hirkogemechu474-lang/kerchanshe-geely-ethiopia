import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { getSurveyEligibility, submitSurvey } from '@/lib/services/csiSurvey/csiSurveyService';

// Post-visit satisfaction survey (BRD FR-602, UC-16). No login required —
// the job card's own id (a random UUID, never shown to any customer other
// than in this emailed link) is the access token. One response per job
// card: CSISurveyResponse.jobCardId is unique, so a resubmission attempt is
// rejected rather than overwriting the original.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobCardId: string }> }) {
  const { jobCardId } = await params;

  const eligibility = await getSurveyEligibility(jobCardId);

  if (!eligibility.eligible) {
    return NextResponse.json(eligibility, { status: eligibility.reason === 'not_found' ? 404 : 200 });
  }

  return NextResponse.json(eligibility);
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

  const result = await submitSurvey(jobCardId, rating, comment);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
