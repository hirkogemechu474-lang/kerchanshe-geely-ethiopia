import { showroomVisitRepository } from '@/repositories/showroomVisitRepository';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { env } from '@/lib/env';

export const ALLOWED_VISIT_ACTIONS = ['sales', 'test-drive', 'purchase', 'quote'];

export type RegisterResult =
  | { ok: true; visitId: string; status: string }
  | { ok: false; httpStatus: 404 | 400; error: string };

// Idempotent: a refresh/back-button on the registration page just updates
// the same row rather than erroring, since the visitor may legitimately
// resubmit. Notification only fires on the first registration.
export async function registerVisit(id: string, input: { fullName: string; phone: string; email: string }): Promise<RegisterResult> {
  if (!input.fullName || !input.phone) {
    return { ok: false, httpStatus: 400, error: 'Name and phone are required' };
  }

  const existing = await showroomVisitRepository.findById(id);
  if (!existing) {
    return { ok: false, httpStatus: 404, error: 'Visit session not found. Please scan the QR code again.' };
  }

  const isFirstRegistration = existing.status === 'started';

  const visit = await showroomVisitRepository.updateRegistration(id, {
    fullName: input.fullName,
    phone: input.phone,
    email: input.email || null,
    status: isFirstRegistration ? 'registered' : existing.status,
    registeredAt: existing.registeredAt || new Date(),
  });

  if (isFirstRegistration && input.email) {
    const siteUrl = env.app.url.replace(/\/$/, '');
    const continueUrl = `${siteUrl}/models?visitId=${encodeURIComponent(visit.id)}`;
    try {
      // Human-friendly reference matching every other confirmation email
      // (GY-SQ-DDMMYYYY-NNN) instead of the internal visit.id UUID. Not
      // persisted — this visit is a browsing session, not itself something
      // customers look up on the status page.
      const reference = await generateReference(REFERENCE_CATEGORY.SHOWROOM_VISIT);
      await sendFormEmail({
        type: 'showroom visit',
        name: input.fullName,
        email: input.email,
        phone: input.phone,
        subject: `Showroom walk-in — ${input.fullName}`,
        reference,
        details: `${input.fullName} registered at the showroom via the QR walk-in flow and is now browsing our vehicle catalog.\n\nContinue browsing: ${continueUrl}`,
      });
    } catch (emailError) {
      console.error('[visit:register:email]', emailError);
    }
  }

  return { ok: true, visitId: visit.id, status: visit.status };
}
