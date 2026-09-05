import { sendEmail, type EmailAttachment } from './smtp';
import { prisma } from '../../config/database';
import { inAppNotificationRepository } from '../../repositories/inAppNotification.repository';
import { userRepository } from '../../repositories';

export interface NotificationPayload {
  type: 'order_status' | 'job_card_status' | 'test_drive' | 'service_booking' | 'quotation' | 'warranty_claim' | 'lead_assignment' | 'commission_reassigned' | 'commission_paid' | 'warranty_registered' | 'service_reminder' | 'complaint_created' | 'upgrade_opportunity' | 'sla_breach';
  to: string[];
  subject: string;
  data: Record<string, any>;
  attachments?: EmailAttachment[];
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

    // Write to audit table for each recipient
    if (result.ok) {
      for (const email of payload.to) {
        try {
          await prisma.notificationHistory.create({
            data: {
              recipientEmail: email,
              notificationType: payload.type,
              subject: payload.subject,
              data: payload.data,
              sentStatus: 'sent',
            },
          });
        } catch {
          // Audit write failure should not block the flow
        }
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
  const dataEntries = Object.entries(payload.data)
    .map(([key, value]) => `<p style="margin: 4px 0;"><strong>${formatKey(key)}:</strong> ${value}</p>`)
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">${payload.subject}</h2>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${dataEntries}
      </div>
    </div>
  `;
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ');
}
