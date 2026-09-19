import { sendEmail, type EmailAttachment } from './smtp';
import { prisma } from '../../config/database';
import { inAppNotificationRepository } from '../../repositories/inAppNotification.repository';
import { userRepository } from '../../repositories';

export interface NotificationPayload {
  type: 'order_status' | 'job_card_status' | 'test_drive' | 'service_booking' | 'quotation' | 'warranty_claim' | 'lead_assignment' | 'commission_reassigned' | 'commission_paid' | 'warranty_registered' | 'service_reminder' | 'first_service_reminder' | 'complaint_created' | 'complaint_status_changed' | 'upgrade_opportunity' | 'sla_breach' | 'delivery_ready' | 'delivery_scheduled' | 'delivered' | 'campaign' | 'financing_application' | 'showroom_visit' | 'parts_request';
  to: string[];
  subject: string;
  data: Record<string, any>;
  attachments?: EmailAttachment[];
  /** When set, the email opens with "Hello {greetingName}," above the data table. */
  greetingName?: string;
  /** One or more labeled call-to-action buttons rendered below the data table (e.g. "Check Status", "Review & Sign"). Any `link`/`adminLink` in `data` still renders too — use ctas for the buttons the workflow spec calls out explicitly. */
  ctas?: { label: string; url: string }[];
  /** In-app notification — if provided, creates a bell notification for each recipient */
  inApp?: {
    type: string;
    title: string;
    body: string;
    link?: string;
    quotationId?: string;
    orderId?: string;
    relatedModel?: string;
    relatedId?: string;
    priority?: string;
  };
}

export async function dispatchNotification(payload: NotificationPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const html = buildNotificationHtml(payload);
    const result = await sendEmail({
      to: payload.to,
      subject: payload.subject,
      html,
      attachments: payload.attachments,
    });

    // Write to audit table for each recipient — including failures, so a
    // "could not be delivered" error is diagnosable afterward instead of
    // only ever appearing in an unmonitored console.error.
    for (const email of payload.to) {
      try {
        await prisma.notificationHistory.create({
          data: {
            recipientEmail: email,
            notificationType: payload.type,
            subject: payload.subject,
            data: payload.data,
            sentStatus: result.ok ? 'sent' : 'failed',
            error: result.ok ? null : result.error,
          },
        });
      } catch {
        // Audit write failure should not block the flow
      }
    }

    // Create in-app notifications for each recipient
    if (payload.inApp) {
      await createInAppNotifications(payload);
    }

    return result;
  } catch (error: any) {
    console.error('[NOTIFICATION DISPATCH ERROR]', error.message);
    return { ok: false, error: error.message };
  }
}

async function createInAppNotifications(payload: NotificationPayload) {
  if (!payload.inApp) return;

  const { inApp } = payload;

  // Resolve each email to a user ID
  const notifications: Array<{
    recipientId: string;
    recipientEmail: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    quotationId?: string;
    orderId?: string;
    relatedModel?: string;
    relatedId?: string;
    priority?: string;
  }> = [];

  for (const email of payload.to) {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) continue;

      // Deduplicate — don't create the same notification type for the same user within 2 minutes
      const existing = await inAppNotificationRepository.findRecentByRecipientAndType(
        user.id, inApp.type, inApp.relatedId || '', 2,
      );
      if (existing) continue;

      notifications.push({
        recipientId: user.id,
        recipientEmail: email,
        type: inApp.type,
        title: inApp.title,
        body: inApp.body,
        link: inApp.link,
        quotationId: inApp.quotationId,
        orderId: inApp.orderId,
        relatedModel: inApp.relatedModel,
        relatedId: inApp.relatedId,
        priority: inApp.priority,
      });
    } catch {
      // User lookup failure should not block the flow
    }
  }

  if (notifications.length > 0) {
    try {
      await inAppNotificationRepository.createMany(notifications);
    } catch (error: any) {
      console.error('[IN-APP NOTIFICATION ERROR]', error.message);
    }
  }
}

function buildNotificationHtml(payload: NotificationPayload): string {
  const ctaButtons = (payload.ctas ?? [])
    .map((cta) => `<a href="${escapeHtml(cta.url)}" style="background: #194BFF; color: #fff; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; display: inline-block; margin: 0 6px 10px;">${escapeHtml(cta.label)}</a>`)
    .join('');

  // A 'campaign' email is customer-facing marketing copy, not an internal
  // status update — render `data.message` as flowing prose (paragraph
  // breaks preserved) instead of the generic "Message: ..." key/value row
  // every other notification type uses.
  const body = payload.type === 'campaign'
    ? `<div style="color: #333; line-height: 1.6; margin: 20px 0; white-space: pre-line;">${escapeHtml(String(payload.data.message ?? ''))}</div>`
    : `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">${buildDataEntries(payload.data)}</div>`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">${escapeHtml(payload.subject)}</h2>
      ${payload.greetingName ? `<p style="margin: 0 0 12px;">Hello ${escapeHtml(payload.greetingName)},</p>` : ''}
      ${body}
      ${ctaButtons ? `<div style="text-align: center; margin: 20px 0;">${ctaButtons}</div>` : ''}
    </div>
  `;
}

function buildDataEntries(data: Record<string, any>): string {
  return Object.entries(data)
    .map(([key, value]) => `<p style="margin: 4px 0;"><strong>${escapeHtml(formatKey(key))}:</strong> ${formatValue(value)}</p>`)
    .join('');
}

function formatValue(value: unknown): string {
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
    return `<a href="${escapeHtml(value)}" style="color: #194BFF;">${escapeHtml(value)}</a>`;
  }
  return escapeHtml(String(value));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ');
}
