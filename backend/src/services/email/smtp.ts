import nodemailer from 'nodemailer';
import { env } from '../../config/env';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (!env.smtp.enabled) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  return transporter;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!env.smtp.enabled) {
      console.log('[SMTP DISABLED] Email would have been sent:', options.subject);
      if (options.attachments) {
        console.log('[SMTP DISABLED] Would have attached:', options.attachments.map(a => a.filename).join(', '));
      }
      return { ok: true };
    }

    const transport = getTransporter();
    await transport.sendMail({
      from: `"${env.smtp.fromName}" <${env.smtp.from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    return { ok: true };
  } catch (error: any) {
    console.error('[SMTP ERROR]', error.message);
    return { ok: false, error: error.message };
  }
}
