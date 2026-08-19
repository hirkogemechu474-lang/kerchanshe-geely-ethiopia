import nodemailer from 'nodemailer';

export type FormEmailDetails = {
  type: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  details: string;
  reference?: string;
};

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
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  const text = [`New ${details.type} submitted`, `Name: ${details.name}`, `Email: ${details.email}`, `Phone: ${details.phone || 'Not provided'}`, details.reference ? `Reference: ${details.reference}` : '', '', details.details].filter(Boolean).join('\n');

  await Promise.all([
    transporter.sendMail({ from, to: adminEmail, replyTo: details.email, subject: details.subject || `New ${details.type}`, text }),
    transporter.sendMail({ from, to: details.email, subject: `Geely Ethiopia received your ${details.type}`, text: `Hello ${details.name},\n\nThank you. We received your ${details.type}. Our team will contact you shortly.\n\n${details.reference ? `Reference: ${details.reference}\n\n` : ''}${details.details}` }),
  ]);
  return true;
}
