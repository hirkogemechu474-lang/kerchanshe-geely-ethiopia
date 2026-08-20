import { sendStatusEmail } from '@/lib/status-email';

// Post-visit satisfaction survey invite (BRD FR-602, UC-16). Triggered
// automatically when a job card reaches INVOICED_CLOSED — never manually by
// staff, per the FR-602 business rule. The public, no-login survey page
// lives in the `web` app at /csi-survey/[jobCardId] and looks the job card
// up directly (web/prisma/schema.prisma mirrors JobCard + CSISurveyResponse
// from this app's schema). SMS/WhatsApp delivery isn't built here either —
// same placeholder situation as lib/workshop/customerNotifications.ts.

export interface CsiSurveyJobCard {
  id: string;
  jobCardNo: string;
  customerEmail: string | null;
  customerName: string;
}

export interface CsiSurveyDispatchResult {
  attempted: boolean;
  success: boolean;
  reason?: string;
  surveyUrl?: string;
}

function resolveWebBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_WEB_URL || process.env.WEB_URL || 'http://localhost:3002').replace(/\/$/, '');
}

export async function sendCsiSurveyInvite(jobCard: CsiSurveyJobCard): Promise<CsiSurveyDispatchResult> {
  const surveyUrl = `${resolveWebBaseUrl()}/csi-survey/${jobCard.id}`;

  if (!jobCard.customerEmail) {
    return { attempted: false, success: false, reason: 'No email address on file for this customer', surveyUrl };
  }

  try {
    const sent = await sendStatusEmail({
      to: jobCard.customerEmail,
      name: jobCard.customerName,
      entityType: 'Service Visit',
      status: 'FEEDBACK_REQUESTED',
      reference: jobCard.jobCardNo,
      details: 'Your vehicle has been picked up. We would love to hear about your experience.',
      actionUrl: surveyUrl,
      actionLabel: 'Share your feedback',
    });
    return {
      attempted: true,
      success: sent,
      reason: sent ? undefined : 'SMTP not configured (set SMTP_ENABLED, SMTP_USER, SMTP_PASS)',
      surveyUrl,
    };
  } catch (error) {
    console.error('[csi-survey] invite email failed', error);
    return {
      attempted: true,
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown email error',
      surveyUrl,
    };
  }
}
