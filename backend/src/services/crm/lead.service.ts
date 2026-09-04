import { prisma } from '../../config/database';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { sendEmail } from '../email/smtp';
import { userRepository } from '../../repositories';

export const leadService = {
  async submit(data: {
    name: string;
    email: string;
    phone: string;
    vehicleInterest?: string;
    message?: string;
    source?: string;
    nationalId?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reference = await generateReference(REFERENCE_CATEGORY.CONTACT);

      const lead = await prisma.quotation.create({
        data: {
          reference,
          customerName: data.name,
          email: data.email,
          phoneNumber: data.phone,
          vehicleModel: data.vehicleInterest,
          message: data.message,
          source: data.source || 'website',
          status: 'new',
          nationalId: data.nationalId || null,
        },
      });

      await sendEmail({
        to: data.email,
        subject: `Thank You for Your Inquiry - ${reference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Thank You for Your Inquiry</h2>
            <p>Dear ${data.name},</p>
            <p>Thank you for your interest in our vehicles. Our sales team will contact you shortly.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Reference:</strong> ${reference}</p>
              ${data.vehicleInterest ? `<p style="margin: 4px 0;"><strong>Vehicle Interest:</strong> ${data.vehicleInterest}</p>` : ''}
            </div>
          </div>
        `,
      });

      return { ok: true, data: lead };
    } catch (error: any) {
      console.error('[LEAD SUBMIT ERROR]', error.message);
      return { ok: false, error: 'Failed to submit inquiry.' };
    }
  },

  async list(params?: { status?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = {};
      if (params?.status && params.status !== 'all') where.status = params.status;

      const leads = await prisma.quotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return { ok: true, data: leads };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch leads.' };
    }
  },

  async assign(leadId: string, assignedTo: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const user = await userRepository.findById(assignedTo);
      if (!user) return { ok: false, error: 'User not found.' };

      const lead = await prisma.quotation.update({
        where: { id: leadId },
        data: {
          assignedTo,
          status: 'contacted',
        },
      });

      return { ok: true, data: lead };
    } catch (error: any) {
      console.error('[LEAD ASSIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to assign lead.' };
    }
  },

  async updateStatus(leadId: string, status: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const lead = await prisma.quotation.update({
        where: { id: leadId },
        data: { status },
      });

      return { ok: true, data: lead };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update lead status.' };
    }
  },
};
