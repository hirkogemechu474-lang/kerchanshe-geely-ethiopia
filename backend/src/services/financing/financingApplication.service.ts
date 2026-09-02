import { prisma } from '../../config/database';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { sendEmail } from '../email/smtp';

// No dedicated FinancingApplication table exists in schema.prisma.
// Message.reference's own doc comment calls out "financing applications"
// as one of the customer-facing flows Message rows back, so this service
// stores applications as Message rows (category: 'financing') and folds
// the structured application fields into `content`.
export const financingApplicationService = {
  async submit(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleModel: string;
    vehicleId?: string;
    programId?: string;
    bankId?: string;
    monthlyIncome?: number;
    employmentStatus?: string;
    employerName?: string;
    downPayment?: number;
    loanTerm?: number;
    notes?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reference = await generateReference(REFERENCE_CATEGORY.FINANCING);

      const content = [
        `Phone: ${data.customerPhone}`,
        `Vehicle: ${data.vehicleModel}${data.vehicleId ? ` (${data.vehicleId})` : ''}`,
        data.programId ? `Program: ${data.programId}` : null,
        data.bankId ? `Bank: ${data.bankId}` : null,
        data.monthlyIncome != null ? `Monthly income: ${data.monthlyIncome}` : null,
        data.employmentStatus ? `Employment status: ${data.employmentStatus}` : null,
        data.employerName ? `Employer: ${data.employerName}` : null,
        data.downPayment != null ? `Down payment: ${data.downPayment}` : null,
        data.loanTerm != null ? `Loan term: ${data.loanTerm} months` : null,
        data.notes ? `Notes: ${data.notes}` : null,
      ]
        .filter((line): line is string => Boolean(line))
        .join('\n');

      const application = await prisma.message.create({
        data: {
          reference,
          from: data.customerName,
          email: data.customerEmail,
          subject: `Financing Application - ${data.vehicleModel}`,
          category: 'financing',
          status: 'unread',
          content,
        },
      });

      await sendEmail({
        to: data.customerEmail,
        subject: `Financing Application Received - ${reference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Financing Application Received</h2>
            <p>Dear ${data.customerName},</p>
            <p>Your financing application has been received successfully.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Reference:</strong> ${reference}</p>
              <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${data.vehicleModel}</p>
            </div>
            <p>Our team will review your application and contact you shortly.</p>
          </div>
        `,
      });

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[FINANCING APPLICATION ERROR]', error.message);
      return { ok: false, error: 'Failed to submit financing application.' };
    }
  },

  async list(params?: { status?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = { category: 'financing' };
      if (params?.status && params.status !== 'all') where.status = params.status;

      const applications = await prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return { ok: true, data: applications };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch applications.' };
    }
  },

  async updateStatus(id: string, status: string, reviewedById: string, notes?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const application = await prisma.message.update({
        where: { id },
        data: {
          status,
          // Message has no reviewedById/reviewedAt columns; fold the
          // reviewer + notes into `response`, this model's one free-text
          // reply field.
          ...(notes && { response: `[Reviewed by ${reviewedById}] ${notes}` }),
        },
      });

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[FINANCING APPLICATION UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update application.' };
    }
  },
};
