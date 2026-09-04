import { sendEmail } from './smtp';

export interface NotificationPayload {
  type: 'order_status' | 'job_card_status' | 'test_drive' | 'service_booking' | 'quotation' | 'warranty_claim' | 'lead_assignment' | 'commission_reassigned' | 'commission_paid' | 'warranty_registered' | 'service_reminder' | 'complaint_created' | 'upgrade_opportunity' | 'sla_breach';
  to: string[];
  subject: string;
  data: Record<string, any>;
}

export async function dispatchNotification(payload: NotificationPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const html = buildNotificationHtml(payload);
    const result = await sendEmail({
      to: payload.to,
      subject: payload.subject,
      html,
    });
    return result;
  } catch (error: any) {
    console.error('[NOTIFICATION DISPATCH ERROR]', error.message);
    return { ok: false, error: error.message };
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
