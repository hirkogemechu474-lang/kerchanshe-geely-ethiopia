import nodemailer from 'nodemailer';
import { newsletterRepository } from '@/repositories/newsletterRepository';

async function sendNewsletterEmail(email: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[newsletter] SMTP is not configured; email skipped');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Welcome to the Geely Ethiopia Newsletter',
    text:
      "Hello,\n\nThank you for subscribing to the Geely Ethiopia newsletter. You'll receive updates on our latest models, special offers, and news.\n\nBest regards,\nGeely Ethiopia",
  });

  if (adminEmail) {
    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: 'New newsletter subscriber',
      text: `A new subscriber joined the newsletter:\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    });
  }
  return true;
}

export type SubscribeResult =
  | { ok: true; alreadySubscribed: true }
  | { ok: true; alreadySubscribed: false; emailSent: boolean };

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  const existing = await newsletterRepository.findByEmail(email);
  if (existing && existing.status === 'subscribed') {
    return { ok: true, alreadySubscribed: true };
  }

  await newsletterRepository.upsertSubscribed(email);

  let emailSent = false;
  try {
    emailSent = await sendNewsletterEmail(email);
  } catch (error) {
    console.error('[newsletter:email]', error);
  }

  return { ok: true, alreadySubscribed: false, emailSent };
}
