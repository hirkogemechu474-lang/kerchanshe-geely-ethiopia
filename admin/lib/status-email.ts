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

interface StatusEmailOptions {
  to: string;
  name?: string;
  entityType: string;
  status: string;
  reference?: string;
  details?: string;
  actionUrl?: string;
  actionLabel?: string;
  attachments?: { filename: string; content: string | Buffer; contentType?: string }[];
}

export async function sendStatusEmail(opts: StatusEmailOptions): Promise<boolean> {
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS || !opts.to) {
    console.warn('[status-email] SMTP not configured or recipient missing; skipped');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

  const statusLabel = opts.status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = `Update on your ${opts.entityType}: ${statusLabel}`;
  const siteUrl = env.app.url.replace(/\/$/, '');
  const statusUrl = opts.reference ? `${siteUrl}/status?ref=${encodeURIComponent(opts.reference)}` : null;
  const text = [
    `Hello ${opts.name || 'there'},`,
    '',
    `We'd like to update you on your ${opts.entityType.toLowerCase()}.`,
    '',
    `Status: ${statusLabel}`,
    opts.reference ? `Reference: ${opts.reference}` : '',
    opts.details ? `Details: ${opts.details}` : '',
    opts.actionUrl ? `${opts.actionLabel || 'Next step'}: ${opts.actionUrl}` : '',
    statusUrl ? `Check your status: ${statusUrl}` : '',
    '',
    "If you have any questions, please contact us. We're happy to help.",
    '',
    'Best regards,',
    'Geely Ethiopia',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">
      <div style="text-align:center;padding:24px 0;">
        <img src="cid:geely-logo" alt="Geely" style="height:56px;" />
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;">
        <h2 style="margin-top:0;">Hello ${opts.name || 'there'},</h2>
        <p>We'd like to update you on your ${opts.entityType.toLowerCase()}.</p>
        <p style="fwont-size:15px;"><strong>Status:</strong> ${statusLabel}</p>
        ${opts.reference ? `<p style="font-size:15px;"><strong>Reference:</strong> ${opts.reference}</p>` : ''}
        ${opts.details ? `<p style="white-space:pre-line;color:#3a4a6b;">${opts.details}</p>` : ''}
        ${
          opts.actionUrl
            ? `<div style="text-align:center;margin:20px 0;"><a href="${opts.actionUrl}" style="background:#1a2b4c;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 24px;border-radius:6px;display:inline-block;">${opts.actionLabel || 'Next step'}</a></div>`
            : ''
        }
        ${
          statusUrl
            ? `<div style="text-align:center;margin:20px 0;"><a href="${statusUrl}" style="background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;display:inline-block;">Check Your Status</a></div>`
            : ''
        }
        <p style="margin-bottom:0;">If you have any questions, please contact us. We're happy to help.</p>
      </div>
      <p style="text-align:center;color:#8a94a6;font-size:12px;margin-top:16px;">Kerchanshe Group &middot; Geely Ethiopia</p>
    </div>
  `;

  const logoBytes = readLogoBytes();
  const attachments = [
    ...(logoBytes ? [{ filename: 'geely-logo.png', content: logoBytes, cid: 'geely-logo' }] : []),
    ...(opts.attachments || []),
  ];
  await transporter.sendMail({ from, to: opts.to, subject, text, html, attachments });
  return true;
}
