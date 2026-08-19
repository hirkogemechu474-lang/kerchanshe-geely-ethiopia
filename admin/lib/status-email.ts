import nodemailer from 'nodemailer';

interface StatusEmailOptions {
  to: string;
  name?: string;
  entityType: string;
  status: string;
  reference?: string;
  details?: string;
  actionUrl?: string;
  actionLabel?: string;
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
  const text = [
    `Hello ${opts.name || 'there'},`,
    '',
    `We'd like to update you on your ${opts.entityType.toLowerCase()}.`,
    '',
    `Status: ${statusLabel}`,
    opts.reference ? `Reference: ${opts.reference}` : '',
    opts.details ? `Details: ${opts.details}` : '',
    opts.actionUrl ? `${opts.actionLabel || 'Next step'}: ${opts.actionUrl}` : '',
    '',
    "If you have any questions, please contact us. We're happy to help.",
    '',
    'Best regards,',
    'Geely Ethiopia',
  ]
    .filter(Boolean)
    .join('\n');

  await transporter.sendMail({ from, to: opts.to, subject, text });
  return true;
}
