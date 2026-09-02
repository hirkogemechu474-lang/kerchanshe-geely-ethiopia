import { sendEmail } from './smtp';
import { env } from '../../config/env';

export async function sendContactFormEmail(params: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">New Contact Form Submission</h2>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${params.name}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${params.email}</p>
        ${params.phone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${params.phone}</p>` : ''}
        <p style="margin: 4px 0;"><strong>Subject:</strong> ${params.subject}</p>
        <p style="margin: 4px 0;"><strong>Message:</strong></p>
        <p style="margin: 4px 0; white-space: pre-wrap;">${params.message}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: env.smtp.from,
    subject: `Contact Form: ${params.subject}`,
    html,
    replyTo: params.email,
  });
}

export async function sendLeadFormEmail(params: {
  name: string;
  email: string;
  phone: string;
  vehicleInterest?: string;
  message?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">New Lead Submission</h2>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${params.name}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${params.email}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${params.phone}</p>
        ${params.vehicleInterest ? `<p style="margin: 4px 0;"><strong>Vehicle Interest:</strong> ${params.vehicleInterest}</p>` : ''}
        ${params.message ? `<p style="margin: 4px 0;"><strong>Message:</strong> ${params.message}</p>` : ''}
      </div>
    </div>
  `;

  return sendEmail({
    to: env.smtp.from,
    subject: `New Lead: ${params.name}`,
    html,
    replyTo: params.email,
  });
}

export async function sendPartsRequestEmail(params: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ partName: string; quantity: number; notes?: string }>;
  additionalNotes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.partName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.notes || '-'}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">New Parts Request</h2>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${params.customerName}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${params.customerEmail}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${params.customerPhone}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #1a1a2e; color: white;">
            <th style="padding: 8px; border: 1px solid #ddd;">Part Name</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Notes</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${params.additionalNotes ? `<p><strong>Additional Notes:</strong> ${params.additionalNotes}</p>` : ''}
    </div>
  `;

  return sendEmail({
    to: env.smtp.from,
    subject: `Parts Request from ${params.customerName}`,
    html,
    replyTo: params.customerEmail,
  });
}
