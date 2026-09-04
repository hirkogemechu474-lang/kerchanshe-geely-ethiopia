import { prisma } from '../../config/database';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';

export interface LeadCreationData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  source?: 'website' | 'walk-in' | 'referral' | 'phone' | 'marketing' | 'chatbot' | 'other';
  vehicleModel?: string;
  vehicleId?: string;
  budgetMin?: number;
  budgetMax?: number;
  financingInterest?: boolean;
  tradeInInterest?: boolean;
  testDriveRequired?: boolean;
  purchaseTimeline?: string;
  preferredContact?: string;
}

export interface LeadQualificationData {
  leadId?: string;
  qualified: boolean;
  budgetMin?: number;
  budgetMax?: number;
  financingInterest?: boolean;
  tradeInInterest?: boolean;
  testDriveRequired?: boolean;
  purchaseTimeline?: string;
  selectedVehicleModel?: string;
  internalNotes?: string;
}

export interface TestDriveScheduleData {
  leadId: string;
  scheduledAt: Date;
  preferredTime: string;
  alternativeDate?: Date;
  alternativeTime?: string;
  location?: string;
  specialRequests?: string;
}

export interface LeadResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

export class LeadService {
  static async create(data: LeadCreationData): Promise<LeadResponse> {
    try {
      const reference = await generateReference(REFERENCE_CATEGORY.LEAD);

      const lead = await prisma.lead.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          customerAddress: data.customerAddress,
          source: data.source ?? 'website',
          vehicleModel: data.vehicleModel,
          vehicleId: data.vehicleId,
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          financingInterest: data.financingInterest ?? false,
          tradeInInterest: data.tradeInInterest ?? false,
          testDriveRequired: data.testDriveRequired ?? false,
          purchaseTimeline: data.purchaseTimeline,
          preferredContact: data.preferredContact,
          status: 'new',
          reference,
        },
      });

      return { ok: true, data: lead };
    } catch (error: any) {
      console.error('[LEAD CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create lead.' };
    }
  }

  static async qualify(
    leadId: string,
    data: LeadQualificationData
  ): Promise<LeadResponse> {
    try {
      const now = new Date();

      const updateData: any = {
        status: data.qualified ? 'qualified' : 'new',
        qualifiedAt: data.qualified ? now : null,
        internalNotes: data.internalNotes,
      };

      // Set qualification fields regardless of status
      if (data.budgetMin !== undefined) updateData.budgetMin = data.budgetMin;
      if (data.budgetMax !== undefined) updateData.budgetMax = data.budgetMax;
      if (data.financingInterest !== undefined) updateData.financingInterest = data.financingInterest;
      if (data.tradeInInterest !== undefined) updateData.tradeInInterest = data.tradeInInterest;
      if (data.testDriveRequired !== undefined) updateData.testDriveRequired = data.testDriveRequired;
      if (data.purchaseTimeline) updateData.purchaseTimeline = data.purchaseTimeline;
      if (data.selectedVehicleModel) updateData.vehicleModel = data.selectedVehicleModel;

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
      });

      return { ok: true, data: lead };
    } catch (error: any) {
      console.error('[LEAD QUALIFY ERROR]', error.message);
      return { ok: false, error: 'Failed to qualify lead.' };
    }
  }

  static async scheduleTestDrive(
    leadId: string,
    data: TestDriveScheduleData
  ): Promise<LeadResponse> {
    try {
      const now = new Date();

      const currentLead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!currentLead) return { ok: false, error: 'Lead not found.' };

      const updated = await prisma.lead.update({
        where: { id: leadId },
        data: {
          testDriveRequired: true,
          status: 'in_progress',
          internalNotes: [
            currentLead.internalNotes,
            `Test drive scheduled: ${data.scheduledAt.toLocaleDateString()} at ${data.preferredTime}`,
            data.specialRequests || '',
          ]
            .filter(Boolean)
            .join(' | '),
        },
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[LEAD TEST DRIVE SCHEDULE ERROR]', error.message);
      return { ok: false, error: 'Failed to schedule test drive.' };
    }
  }

  static async assign(leadId: string, salesRepId: string): Promise<LeadResponse> {
    try {
      const now = new Date();

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          assignedTo: salesRepId,
          commissionOwner: salesRepId,
          commissionSince: now,
          status: 'contacted',
          contactedAt: now,
        },
      });

      return { ok: true, data: lead };
    } catch (error: any) {
      console.error('[LEAD ASSIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to assign lead.' };
    }
  }

  static async escalate(
    leadId: string,
    reason: string,
    newAssignee?: string
  ): Promise<LeadResponse> {
    try {
      const now = new Date();

      const updateData: any = {
        status: 'new',
        internalNotes: [
          ...(await this.getAssignmentHistory(leadId)),
          `ESCALATED: ${reason} at ${now.toLocaleString()}`,
        ].filter(Boolean).join(' | '),
      };

      if (newAssignee) {
        updateData.assignedTo = newAssignee;
        updateData.commissionOwner = newAssignee;
        updateData.commissionSince = now;
      }

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
      });

      return { ok: true, data: lead };
    } catch (error: any) {
      console.error('[LEAD ESCALATE ERROR]', error.message);
      return { ok: false, error: 'Failed to escalate lead.' };
    }
  }

  private static async getAssignmentHistory(leadId: string): Promise<Array<{assignee: string; role: string; reason: string; assignedAt: Date; releasedAt?: Date}>> {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead?.assignmentHistory) return [];
    try {
      const raw = lead.assignmentHistory as unknown;
      if (Array.isArray(raw)) return raw as any[];
      if (typeof raw === 'string') return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  }

  static async addToAssignmentHistory(
    leadId: string,
    assignee: string,
    role: string,
    reason: string
  ): Promise<void> {
    const now = new Date();
    const history = await this.getAssignmentHistory(leadId);
    history.push({ assignee, role, reason, assignedAt: now });
    await prisma.lead.update({
      where: { id: leadId },
      data: { assignmentHistory: JSON.stringify(history) },
    });
  }
}