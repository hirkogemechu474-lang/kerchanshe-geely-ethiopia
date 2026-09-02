import { prisma } from '../../config/database';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { sendEmail } from '../email/smtp';

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

      const application = await prisma.financingApplication.create({
        data: {
          reference,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          vehicleModel: data.vehicleModel,
          vehicleId: data.vehicleId,
          programId: data.programId,
          bankId: data.bankId,
          monthlyIncome: data.monthlyIncome,
          employmentStatus: data.employmentStatus,
          employerName: data.employerName,
          downPayment: data.downPayment,
          loanTerm: data.loanTerm,
          notes: data.notes,
          status: 'SUBMITTED',
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
      const where: any = {};
      if (params?.status && params.status !== 'all') where.status = params.status;

      const applications = await prisma.financingApplication.findMany({
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
      const application = await prisma.financingApplication.update({
        where: { id },
        data: {
          status,
          reviewedById,
          reviewedAt: new Date(),
          ...(notes && { reviewNotes: notes }),
        },
      });

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[FINANCING APPLICATION UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update application.' };
    }
  },
};
