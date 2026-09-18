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
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

// Google's MX pool rotates across many IPs and occasionally refuses/times out
// a fresh connection (WSAETIMEDOUT "connect error 10060", or a 421 greeting
// failure) even though the account and credentials are fine — the same send
// routinely succeeds seconds later against a different IP. These are the only
// errors worth retrying; anything else (bad auth, invalid recipient, etc.) is
// permanent and retrying it would just waste time.
function isTransientSmtpError(error: any): boolean {
  const transientCodes = ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNRESET', 'EAI_AGAIN'];
  if (error?.code && transientCodes.includes(error.code)) return true;
  if (error?.responseCode === 421) return true;
  const message: string = error?.message || '';
  return /connect error 10060|ETIMEDOUT|Invalid greeting|Connection timeout/i.test(message);
}

const RETRY_DELAYS_MS = [2000, 5000];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!env.smtp.enabled) {
    console.log('[SMTP DISABLED] Email would have been sent:', options.subject, 'to:', Array.isArray(options.to) ? options.to.join(', ') : options.to);
    if (options.attachments) {
      console.log('[SMTP DISABLED] Would have attached:', options.attachments.map(a => a.filename).join(', '));
    }
    return { ok: true };
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
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
      lastError = error;

      if (!isTransientSmtpError(error) || attempt === RETRY_DELAYS_MS.length) {
        break;
      }

      console.warn(`[SMTP RETRY] Transient error sending "${options.subject}" (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length + 1}): ${error.message}. Retrying in ${RETRY_DELAYS_MS[attempt]}ms...`);
      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }

  console.error('[SMTP ERROR]', lastError?.message);
  return { ok: false, error: lastError?.message };
}
