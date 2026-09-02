import { sendEmail } from './smtp';
import { env } from '../../config/env';

export async function sendOrderStatusEmail(params: {
  to: string;
  customerName: string;
  orderNo: string;
  status: string;
  vehicleModel: string;
}): Promise<{ ok: boolean; error?: string }> {
  const statusLabels: Record<string, string> = {
    QUOTED: 'Quoted',
    BOOKED: 'Booked',
    FINANCING_PENDING: 'Financing Pending',
    ALLOCATED: 'Allocated',
    INVOICE_GENERATED: 'Invoice Generated',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Order Status Update</h2>
      <p>Dear ${params.customerName},</p>
      <p>Your order <strong>${params.orderNo}</strong> for <strong>${params.vehicleModel}</strong> has been updated.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>New Status:</strong> ${statusLabels[params.status] || params.status}</p>
      </div>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br/>${env.smtp.fromName}</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Order ${params.orderNo} - Status Updated`,
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
