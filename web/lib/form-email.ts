import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { env } from './env';

// Most mail clients (Gmail included) won't fetch an <img src> pointing at
// http://localhost, and many block remote images by default even when the
// URL is public — so the logo is attached inline via cid instead of linked.
function readLogoBytes(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'logos', 'geely-logo.png'));
  } catch {
    return null;
  }
}

export type FormEmailDetails = {
  type: string;
  name: string;
  // Optional for phone-only quick requests (see web/app/api/public/quick-request/route.ts)
  // — no customer confirmation is sent when absent, only the admin notification.
  email?: string;
  phone?: string;
  subject?: string;
  details: string;
  reference?: string;
};

// Retries a transient send failure once after a short delay before giving
// up — a brief DNS/network blip talking to the SMTP host shouldn't turn
// into a user-facing "email could not be sent" on the very first attempt.
async function sendMailWithRetry(
  transporter: nodemailer.Transporter,
  options: Parameters<nodemailer.Transporter['sendMail']>[0]
): Promise<void> {
  try {
    await transporter.sendMail(options);
  } catch (firstError) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      await transporter.sendMail(options);
    } catch (secondError) {
      console.error('[form-email] Send failed after retry:', secondError);
      throw secondError;
    }
  }
}

const BASE_URL = env.app.url.replace(/\/$/, '');

// Shared HTML shell for customer confirmation emails: logo, heading, body,
// and (when a reference exists) a "Check Your Status" link back to
// web/app/status/page.tsx. Absolute logo URL because most mail clients
// won't fetch relative paths.
function buildConfirmationHtml(details: FormEmailDetails): string {
  const statusLink = details.reference ? `${BASE_URL}/status?ref=${encodeURIComponent(details.reference)}` : null;
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">
      <div style="text-align:center;padding:24px 0;">
        <img src="cid:geely-logo" alt="Geely" style="height:56px;" />
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;">
        <h2 style="margin-top:0;color:#1a2b4c;">Hello ${details.name},</h2>
        <p>Thank you. We received your ${details.type}. Our team will contact you shortly.</p>
        ${details.reference ? `<p style="font-size:15px;"><strong>Reference:</strong> ${details.reference}</p>` : ''}
        <p style="white-space:pre-line;color:#3a4a6b;">${details.details}</p>
        ${
          statusLink
            ? `<div style="text-align:center;margin:28px 0;">
                <a href="${statusLink}" style="background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;display:inline-block;">Check Your Status</a>
              </div>`
            : ''
        }
        <p style="margin-bottom:0;">
          Browse our full model lineup: <a href="${BASE_URL}/models" style="color:#0b5fff;">${BASE_URL}/models</a><br />
          Visit our website: <a href="${BASE_URL}" style="color:#0b5fff;">${BASE_URL}</a>
        </p>
      </div>
      <p style="text-align:center;color:#8a94a6;font-size:12px;margin-top:16px;">Kerchanshe Group &middot; Geely Ethiopia</p>
    </div>
  `;
}

export async function sendFormEmail(details: FormEmailDetails): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS || !adminEmail) {
    console.warn('[form-email] SMTP is not configured; notification skipped');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  const text = [`New ${details.type} submitted`, `Name: ${details.name}`, `Email: ${details.email || 'Not provided'}`, `Phone: ${details.phone || 'Not provided'}`, details.reference ? `Reference: ${details.reference}` : '', '', details.details].filter(Boolean).join('\n');
  const logoBytes = readLogoBytes();

  // Send the admin notification and the customer confirmation independently
  // — a bad/unreachable customer address shouldn't also swallow the admin
  // notification (or vice versa), and each side gets its own retry. No
  // customer confirmation at all for a phone-only lead (no email on file).
  const results = await Promise.allSettled([
    sendMailWithRetry(transporter, { from, to: adminEmail, replyTo: details.email, subject: details.subject || `New ${details.type}`, text }),
    ...(details.email
      ? [
          sendMailWithRetry(transporter, {
            from,
            to: details.email,
            subject: `Geely Ethiopia received your ${details.type}`,
            text: `Hello ${details.name},\n\nThank you. We received your ${details.type}. Our team will contact you shortly.\n\n${details.reference ? `Reference: ${details.reference}\n\n` : ''}${details.details}\n\n${details.reference ? `Check your status: ${BASE_URL}/status?ref=${encodeURIComponent(details.reference)}\n\n` : ''}Browse our full model lineup: ${BASE_URL}/models\nVisit our website: ${BASE_URL}`,
            html: buildConfirmationHtml(details),
            attachments: logoBytes ? [{ filename: 'geely-logo.png', content: logoBytes, cid: 'geely-logo' }] : undefined,
          }),
        ]
      : []),
  ]);

  const [adminResult, customerResult] = results;
  if (adminResult.status === 'rejected') {
    console.error('[form-email] Admin notification failed:', adminResult.reason);
  }
  if (customerResult && customerResult.status === 'rejected') {
    console.error('[form-email] Customer confirmation failed:', customerResult.reason);
  }

  // Report success if the admin notification went out — that's the one
  // that actually needs a human to act on the lead. A failed customer
  // confirmation is logged but doesn't block the admin side from counting.
  return adminResult.status === 'fulfilled';
}
