import { sendStatusEmail } from '@/lib/status-email';

// Customer milestone notifications (BRD FR-601, UC-10): "job started",
// "awaiting your approval", "ready for pick-up". Email rides the existing
// SMTP channel (lib/status-email.ts) and is real today. SMS/WhatsApp have no
// provider wired up yet — see docs/SWMS-INTEGRATION-BACKLOG.md — so they are
// deliberate placeholders: they never throw and never silently no-op, they
// report a specific "not configured" reason so a failure is always visible
// to the advisor (FR-601 business rule), never dropped.

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface NotificationAttemptResult {
  channel: NotificationChannel;
  attempted: boolean;
  success: boolean;
  reason?: string;
}

export interface JobCardMilestone {
  key: 'AWAITING_APPROVAL' | 'JOB_STARTED' | 'READY_FOR_PICKUP';
  message: string;
}

/**
 * Only these three job-card transitions are customer-facing milestones.
 * Everything else (bay reassignment, parts waiting, QC rework, etc.) is
 * workshop-internal and stays silent to the customer.
 */
export function resolveMilestone(fromStatus: string | null, toStatus: string): JobCardMilestone | null {
  if (toStatus === 'AWAITING_APPROVAL') {
    return {
      key: 'AWAITING_APPROVAL',
      message:
        "We've diagnosed your vehicle and prepared an estimate. Please contact us or reply to approve before we proceed.",
    };
  }
  if (fromStatus === 'AWAITING_APPROVAL' && toStatus === 'IN_PROGRESS') {
    return {
      key: 'JOB_STARTED',
      message: 'Your vehicle is now being worked on. We will let you know as soon as it is ready.',
    };
  }
  if (toStatus === 'INVOICED_CLOSED') {
    return {
      key: 'READY_FOR_PICKUP',
      message: 'Your vehicle is ready for pick-up. Thank you for choosing us.',
    };
  }
  return null;
}

/**
 * Placeholder SMS/WhatsApp sender. Enable by setting SMS_PROVIDER_ENABLED /
 * WHATSAPP_PROVIDER_ENABLED to 'true' and replacing the body below with a
 * real provider call (Twilio, Africa's Talking, Meta Cloud API, etc.) once
 * credentials exist — the call site and return shape don't need to change.
 */
async function sendPlaceholderChannel(channel: 'sms' | 'whatsapp', to: string): Promise<NotificationAttemptResult> {
  const enabledFlag = channel === 'sms' ? 'SMS_PROVIDER_ENABLED' : 'WHATSAPP_PROVIDER_ENABLED';
  if (process.env[enabledFlag] !== 'true') {
    const reason = `${channel === 'sms' ? 'SMS' : 'WhatsApp'} provider not configured yet (set ${enabledFlag}=true and provider credentials to enable)`;
    console.warn(`[customer-notifications] ${reason} — skipped for ${to}`);
    return { channel, attempted: false, success: false, reason };
  }

  // Unreachable until a real provider integration replaces this block.
  return {
    channel,
    attempted: true,
    success: false,
    reason: `${enabledFlag} is set but no ${channel} provider is wired up yet`,
  };
}

export interface MilestoneJobCard {
  customerEmail: string | null;
  customerPhone: string;
  customerName: string;
  jobCardNo: string;
}

export async function sendJobCardMilestoneNotification(
  jobCard: MilestoneJobCard,
  fromStatus: string | null,
  toStatus: string
): Promise<{ milestone: string; results: NotificationAttemptResult[] } | null> {
  const milestone = resolveMilestone(fromStatus, toStatus);
  if (!milestone) return null;

  const results: NotificationAttemptResult[] = [];

  if (jobCard.customerEmail) {
    try {
      const sent = await sendStatusEmail({
        to: jobCard.customerEmail,
        name: jobCard.customerName,
        entityType: 'Service Job',
        status: milestone.key,
        reference: jobCard.jobCardNo,
        details: milestone.message,
      });
      results.push({
        channel: 'email',
        attempted: true,
        success: sent,
        reason: sent ? undefined : 'SMTP not configured (set SMTP_ENABLED, SMTP_USER, SMTP_PASS)',
      });
    } catch (error) {
      console.error('[customer-notifications] email send failed', error);
      results.push({
        channel: 'email',
        attempted: true,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown email error',
      });
    }
  } else {
    results.push({ channel: 'email', attempted: false, success: false, reason: 'No email address on file for this customer' });
  }

  results.push(await sendPlaceholderChannel('sms', jobCard.customerPhone));
  results.push(await sendPlaceholderChannel('whatsapp', jobCard.customerPhone));

  return { milestone: milestone.key, results };
}
