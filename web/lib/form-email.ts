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
  const text = [`New ${details.type} submitted`, `Name: ${details.name}`, `Email: ${details.email}`, `Phone: ${details.phone || 'Not provided'}`, details.reference ? `Reference: ${details.reference}` : '', '', details.details].filter(Boolean).join('\n');

  // Send the admin notification and the customer confirmation independently
  // — a bad/unreachable customer address shouldn't also swallow the admin
  // notification (or vice versa), and each side gets its own retry.
  const results = await Promise.allSettled([
    sendMailWithRetry(transporter, { from, to: adminEmail, replyTo: details.email, subject: details.subject || `New ${details.type}`, text }),
    sendMailWithRetry(transporter, { from, to: details.email, subject: `Geely Ethiopia received your ${details.type}`, text: `Hello ${details.name},\n\nThank you. We received your ${details.type}. Our team will contact you shortly.\n\n${details.reference ? `Reference: ${details.reference}\n\n` : ''}${details.details}` }),
  ]);

  const [adminResult, customerResult] = results;
  if (adminResult.status === 'rejected') {
    console.error('[form-email] Admin notification failed:', adminResult.reason);
  }
  if (customerResult.status === 'rejected') {
    console.error('[form-email] Customer confirmation failed:', customerResult.reason);
  }

  // Report success if the admin notification went out — that's the one
  // that actually needs a human to act on the lead. A failed customer
  // confirmation is logged but doesn't block the admin side from counting.
  return adminResult.status === 'fulfilled';
}
