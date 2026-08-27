import { csiSurveyRepository } from '@/repositories/csiSurveyRepository';
import { sendFormEmail } from '@/lib/form-email';

// BRD FR-602, UC-16 — one response per job card. No login required: the job
// card's own id (a random UUID, never shown to any customer other than in
// the emailed link) is the access token.

export type SurveyEligibility =
  | { eligible: true; jobCardNo: string; vehicleModel: string | null; customerName: string }
  | { eligible: false; reason: 'not_found' | 'not_closed' | 'already_submitted' };

export async function getSurveyEligibility(jobCardId: string): Promise<SurveyEligibility> {
  const jobCard = await csiSurveyRepository.findJobCardForEligibility(jobCardId);

  if (!jobCard) return { eligible: false, reason: 'not_found' };
  if (jobCard.status !== 'INVOICED_CLOSED') return { eligible: false, reason: 'not_closed' };
  if (jobCard.csiSurveyResponse) return { eligible: false, reason: 'already_submitted' };

  return {
    eligible: true,
    jobCardNo: jobCard.jobCardNo,
    vehicleModel: jobCard.vehicleModel,
    customerName: jobCard.customerName,
  };
}

export type SubmitSurveyResult =
  | { ok: true }
  | { ok: false; status: 404 | 400 | 409 | 500; error: string };

export async function submitSurvey(jobCardId: string, rating: number, comment: string | null): Promise<SubmitSurveyResult> {
  const jobCard = await csiSurveyRepository.findJobCardForSubmit(jobCardId);

  if (!jobCard) return { ok: false, status: 404, error: 'Survey not found' };
  if (jobCard.status !== 'INVOICED_CLOSED') {
    return { ok: false, status: 400, error: 'This job card is not yet closed' };
  }

  try {
    await csiSurveyRepository.createResponse(jobCardId, rating, comment);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { ok: false, status: 409, error: 'A response has already been submitted for this visit' };
    }
    console.error('[csi-survey] submit failed', error);
    return { ok: false, status: 500, error: 'Failed to submit survey' };
  }

  if (jobCard.customerEmail) {
    try {
      await sendFormEmail({
        type: 'satisfaction survey',
        name: jobCard.customerName,
        email: jobCard.customerEmail,
        subject: `Satisfaction survey received — ${jobCard.jobCardNo}`,
        reference: jobCard.jobCardNo,
        details: [
          `Vehicle: ${jobCard.vehicleModel || 'Not on file'}`,
          `Rating: ${rating}/5`,
          comment ? `Comment: ${comment}` : 'Comment: Not provided',
        ].join('\n'),
      });
    } catch (emailError) {
      console.error('[csi-survey:email]', emailError);
    }
  }

  return { ok: true };
}
