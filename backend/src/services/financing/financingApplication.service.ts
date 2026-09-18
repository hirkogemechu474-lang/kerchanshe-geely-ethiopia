import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

export interface FinancingApplicationCreationData {
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleId?: string;
  vehicleModel: string;
  vehiclePrice: number;
  requestedAmount: number;
  downPayment?: number;
  tenureMonths: number;
  interestRate?: number;
}

export interface FinancingApplicationUpdateData {
  status: 'PENDING' | 'DOCUMENTS_REQUIRED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'DECLINED';
  rejectionReason?: string;
  documentsSubmitted?: boolean;
  paymentProofUrl?: string;
}

export interface FinancingApplicationResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

export class FinancingApplicationService {
  static async getAll(): Promise<FinancingApplicationResponse> {
    try {
      const applications = await prisma.financingApplication.findMany({
        orderBy: { createdAt: 'desc' },
        include: { lead: true },
      });
      return { ok: true, data: applications };
    } catch (error: any) {
      console.error('[GET ALL FINANCING APPLICATIONS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch financing applications.' };
    }
  }

  static async create(data: FinancingApplicationCreationData): Promise<FinancingApplicationResponse> {
    try {
      const application = await prisma.financingApplication.create({
        data: {
          leadId: data.leadId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          vehicleId: data.vehicleId,
          vehicleModel: data.vehicleModel,
          vehiclePrice: data.vehiclePrice,
          requestedAmount: data.requestedAmount,
          downPayment: data.downPayment ?? 0,
          tenureMonths: data.tenureMonths,
          interestRate: data.interestRate ?? 0,
          status: 'PENDING',
        },
      });

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[FINANCING APPLICATION CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create financing application.' };
    }
  }

  static async updateStatus(
    applicationId: string,
    data: FinancingApplicationUpdateData
  ): Promise<FinancingApplicationResponse> {
    try {
      const updateData: any = {
        status: data.status,
      };

      if (data.rejectionReason) updateData.rejectionReason = data.rejectionReason;
      if (data.documentsSubmitted !== undefined) updateData.documentsSubmitted = data.documentsSubmitted;
      if (data.paymentProofUrl) updateData.paymentProofUrl = data.paymentProofUrl;

      const application = await prisma.financingApplication.update({
        where: { id: applicationId },
        data: updateData,
      });

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[FINANCING APPLICATION UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update financing application.' };
    }
  }

  static async getByLeadId(leadId: string): Promise<FinancingApplicationResponse> {
    try {
      const application = await prisma.financingApplication.findFirst({
        where: { leadId },
      });

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[GET FINANCING APPLICATION ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch financing application.' };
    }
  }

  static async approve(
    applicationId: string,
    approvedById: string,
    isConditional: boolean = false
  ): Promise<FinancingApplicationResponse> {
    try {
      const status = isConditional ? 'CONDITIONALLY_APPROVED' : 'APPROVED';

      const application = await prisma.financingApplication.update({
        where: { id: applicationId },
        // approvedAt existed on the schema but was never actually stamped —
        // every approval looked "unapproved" by timestamp.
        data: { status, approvedById, approvedAt: new Date() },
      });

      if (application.customerEmail) {
        const label = isConditional ? 'Conditionally Approved' : 'Approved';
        await dispatchNotification({
          type: 'financing_application',
          to: [application.customerEmail],
          subject: `Financing Application ${label} — ${application.vehicleModel}`,
          data: {
            message: isConditional
              ? `Good news — your financing application for the ${application.vehicleModel} has been conditionally approved. Our finance team will contact you about the remaining requirements.`
              : `Good news — your financing application for the ${application.vehicleModel} has been approved. Our finance team will contact you with next steps.`,
          },
          greetingName: application.customerName,
        }).catch(() => {});
      }

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[FINANCING APPROVE ERROR]', error.message);
      return { ok: false, error: 'Failed to approve financing application.' };
    }
  }

  static async decline(
    applicationId: string,
    rejectionReason: string
  ): Promise<FinancingApplicationResponse> {
    try {
      const application = await prisma.financingApplication.update({
        where: { id: applicationId },
        data: { status: 'DECLINED', rejectionReason },
      });

      if (application.customerEmail) {
        await dispatchNotification({
          type: 'financing_application',
          to: [application.customerEmail],
          subject: `Financing Application Update — ${application.vehicleModel}`,
          data: {
            message: `We're unable to approve your financing application for the ${application.vehicleModel} at this time.${
              rejectionReason ? ` Reason: ${rejectionReason}` : ''
            } Contact us to discuss other options.`,
          },
          greetingName: application.customerName,
        }).catch(() => {});
      }

      return { ok: true, data: application };
    } catch (error: any) {
      console.error('[FINANCING DECLINE ERROR]', error.message);
      return { ok: false, error: 'Failed to decline financing application.' };
    }
  }
}