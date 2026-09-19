import { sendEmail } from './smtp';
import { env } from '../../config/env';

export async function sendQuotationConfirmationEmail(params: {
  to: string;
  customerName: string;
  reference: string;
  vehicleModel?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const modelsLink = `${env.urls.site}/models`;
  const statusLink = `${env.urls.site}/status?ref=${encodeURIComponent(params.reference)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #000; padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">GEELY</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #1a1a2e; margin-top: 0;">Quotation Request Received</h2>
        <p>Dear ${params.customerName},</p>
        <p>Thank you for your interest in Geely! We have received your quotation request and our team is already working on it.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0 0 8px;"><strong>Reference Number:</strong> ${params.reference}</p>
          ${params.vehicleModel ? `<p style="margin: 0 0 8px;"><strong>Vehicle:</strong> ${params.vehicleModel}</p>` : ''}
          <p style="margin: 0 0 8px;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p style="margin: 0;"><strong>Status:</strong> Under Review</p>
        </div>

        <div style="background: #e8f4fd; border-left: 4px solid #194BFF; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #1a1a2e; font-size: 16px;">What Happens Next?</p>
          <p style="margin: 0 0 10px; color: #333;">A dedicated sales consultant will be assigned to your request. They will contact you shortly to discuss your requirements and prepare a personalized quotation.</p>
          <p style="margin: 0; color: #333;">Please keep your reference number (<strong>${params.reference}</strong>) handy for any future inquiries.</p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${statusLink}" style="background: #194BFF; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block; margin: 0 6px 10px;">Check Status</a>
          <a href="${modelsLink}" style="background: #fff; color: #194BFF; border: 2px solid #194BFF; text-decoration: none; padding: 10px 26px; border-radius: 6px; font-weight: bold; display: inline-block; margin: 0 6px 10px;">Browse Our Models</a>
        </div>

        <p style="color: #666;">If you have any questions, please don't hesitate to contact us.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
        <p style="color: #999; font-size: 12px; margin: 0;">Best regards,<br/>${env.smtp.fromName}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Quotation Request Received — ${params.reference}`,
    html,
  });
}

export async function sendJobCardStatusEmail(params: {
  to: string;
  customerName: string;
  jobCardNo: string;
  status: string;
  vehicleModel: string;
}): Promise<{ ok: boolean; error?: string }> {
  const statusLabels: Record<string, string> = {
    DRAFT_CHECKIN: 'Draft Check-in',
    CHECKED_IN: 'Checked In',
    IN_PROGRESS: 'In Progress',
    QC_PENDING: 'QC Pending',
    QC_PASSED: 'QC Passed',
    READY_FOR_PICKUP: 'Ready for Pickup',
    INVOICED_CLOSED: 'Invoiced & Closed',
    CANCELLED: 'Cancelled',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Service Update</h2>
      <p>Dear ${params.customerName},</p>
      <p>Your service job card <strong>${params.jobCardNo}</strong> for <strong>${params.vehicleModel}</strong> has been updated.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Status:</strong> ${statusLabels[params.status] || params.status}</p>
      </div>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br/>${env.smtp.fromName}</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Service ${params.jobCardNo} - Status Updated`,
    html,
  });
}

export async function sendTestDriveConfirmationEmail(params: {
  to: string;
  customerName: string;
  reference: string;
  vehicleName: string;
  preferredDate: string;
  preferredTime: string;
}): Promise<{ ok: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Test Drive Confirmation</h2>
      <p>Dear ${params.customerName},</p>
      <p>Your test drive request has been confirmed!</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Vehicle:</strong> ${params.vehicleName}</p>
        <p style="margin: 5px 0 0;"><strong>Date:</strong> ${params.preferredDate}</p>
        <p style="margin: 5px 0 0;"><strong>Time:</strong> ${params.preferredTime}</p>
        <p style="margin: 5px 0 0;"><strong>Reference:</strong> ${params.reference}</p>
      </div>
      <p>Please bring a valid driver's license. If you need to reschedule, contact us.</p>
      <p>Best regards,<br/>${env.smtp.fromName}</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Test Drive Confirmed - ${params.vehicleName}`,
    html,
  });
}

export async function sendTestDriveApprovalEmail(params: {
  to: string;
  customerName: string;
  vehicleName: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  contactPhone?: string;
  contactAddress?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #000; padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">GEELY</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #1a1a2e; margin-top: 0;">Your Test Drive is Approved!</h2>
        <p>Dear ${params.customerName},</p>
        <p>Great news! Your test drive request for the <strong>${params.vehicleName}</strong> has been approved by our team.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0 0 8px; font-size: 16px;"><strong>Vehicle:</strong> ${params.vehicleName}</p>
          <p style="margin: 0 0 8px;"><strong>Date:</strong> ${params.preferredDate}</p>
          <p style="margin: 0 0 8px;"><strong>Time:</strong> ${params.preferredTime}</p>
          <p style="margin: 0;"><strong>Location:</strong> ${params.location}</p>
        </div>

        <div style="background: #e8f4fd; border-left: 4px solid #194BFF; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #1a1a2e; font-size: 16px;">Next Steps</p>
          <p style="margin: 0 0 10px; color: #333;">If you are truly interested in purchasing this vehicle, we invite you to visit our office to complete the process and take advantage of exclusive offers.</p>
          <p style="margin: 0; color: #333;">Our sales team will be happy to assist you with financing options, trade-in evaluations, and any questions you may have.</p>
        </div>

        ${params.contactPhone || params.contactAddress ? `
        <div style="margin: 25px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #1a1a2e;">Contact Our Office:</p>
          ${params.contactPhone ? `<p style="margin: 0 0 4px;">Phone: <a href="tel:${params.contactPhone}" style="color: #194BFF;">${params.contactPhone}</a></p>` : ''}
          ${params.contactAddress ? `<p style="margin: 0;">Address: ${params.contactAddress}</p>` : ''}
        </div>
        ` : ''}

        <p style="color: #666; font-size: 14px;">Please bring a valid driver's license on the day of your test drive.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
        <p style="color: #999; font-size: 12px; margin: 0;">Best regards,<br/>${env.smtp.fromName}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Your Test Drive for ${params.vehicleName} is Approved!`,
    html,
  });
}

export async function sendServiceBookingConfirmationEmail(params: {
  to: string;
  customerName: string;
  reference: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  vehicleInfo: string;
}): Promise<{ ok: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Service Booking Confirmed</h2>
      <p>Dear ${params.customerName},</p>
      <p>Your service booking has been confirmed!</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Service Type:</strong> ${params.serviceType}</p>
        <p style="margin: 5px 0 0;"><strong>Vehicle:</strong> ${params.vehicleInfo}</p>
        <p style="margin: 5px 0 0;"><strong>Date:</strong> ${params.date}</p>
        <p style="margin: 5px 0 0;"><strong>Time Slot:</strong> ${params.timeSlot}</p>
        <p style="margin: 5px 0 0;"><strong>Reference:</strong> ${params.reference}</p>
      </div>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br/>${env.smtp.fromName}</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Service Booking Confirmed - ${params.reference}`,
    html,
  });
}

export async function sendPartsRequestConfirmationEmail(params: {
  to: string;
  customerName: string;
  reference: string;
  items: { partName: string; partSku?: string | null; unitPrice: number; quantity: number }[];
}): Promise<{ ok: boolean; error?: string }> {
  const statusLink = `${env.urls.site}/status?ref=${encodeURIComponent(params.reference)}`;
  const total = params.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const rows = params.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.partName}${item.partSku ? ` <span style="color: #999;">(${item.partSku})</span>` : ''}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">ETB ${(item.unitPrice * item.quantity).toLocaleString('en-US')}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Parts Quote Request Received</h2>
      <p>Dear ${params.customerName},</p>
      <p>Thank you for your parts request. Our team will review it and send you a detailed quote shortly.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #1a1a2e;">Part</th>
            <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #1a1a2e;">Qty</th>
            <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #1a1a2e;">Est. Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align: right; font-weight: bold;">Estimated Total: ETB ${total.toLocaleString('en-US')}</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Reference:</strong> ${params.reference}</p>
      </div>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${statusLink}" style="background: #194BFF; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">Check Status</a>
      </div>
      <p>Final pricing and availability will be confirmed by our parts team before anything is payable.</p>
      <p>Best regards,<br/>${env.smtp.fromName}</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Parts Quote Request Received — ${params.reference}`,
    html,
  });
}

export async function sendRoadsideAssistanceConfirmationEmail(params: {
  to: string;
  customerName: string;
  reference: string;
  currentLocation: string;
  issueType: string;
  vehicleInfo: string;
  emergencyPhone: string;
}): Promise<{ ok: boolean; error?: string }> {
  const statusLink = `${env.urls.site}/status?ref=${encodeURIComponent(params.reference)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Help Is on the Way</h2>
      <p>Dear ${params.customerName},</p>
      <p>We've received your roadside assistance request and dispatch is being arranged now.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Issue:</strong> ${params.issueType}</p>
        <p style="margin: 5px 0 0;"><strong>Vehicle:</strong> ${params.vehicleInfo}</p>
        <p style="margin: 5px 0 0;"><strong>Location:</strong> ${params.currentLocation}</p>
        <p style="margin: 5px 0 0;"><strong>Reference:</strong> ${params.reference}</p>
      </div>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b;"><strong>Need to talk to someone right now?</strong> Call our 24/7 hotline: <a href="tel:${params.emergencyPhone}" style="color: #991b1b; font-weight: bold;">${params.emergencyPhone}</a></p>
      </div>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${statusLink}" style="background: #194BFF; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">Check Status</a>
      </div>
      <p>Please keep your phone accessible — our team will call you shortly to confirm your exact location.</p>
      <p>Best regards,<br/>${env.smtp.fromName}</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Roadside Assistance Requested — ${params.reference}`,
    html,
  });
}
