import { quotationRepository, vehicleRepository, userRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { assignSalesRep, type AssignmentFactors } from './assignSalesRep';
import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

export const quotationService = {
  async create(data: {
    customerName: string;
    phoneNumber: string;
    email?: string;
    vehicleModel?: string;
    message?: string;
    assignedTo?: string;
    autoAssign?: boolean;
    assignmentFactors?: AssignmentFactors;
  }): Promise<{ ok: boolean; data?: any; error?: string; assignedRep?: any }> {
    try {
      const existingOpen = await quotationRepository.findOpenByPhone(data.phoneNumber);
      if (existingOpen) {
        return { ok: false, error: 'An open quotation already exists for this phone number.' };
      }

      const reference = await generateReference(REFERENCE_CATEGORY.QUOTATION);

      const quotationCreateData: any = {
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        vehicleModel: data.vehicleModel,
        message: data.message,
        reference,
        status: 'new',
        managerApprovalStatus: 'PENDING',
      };

      // Auto-assign sales representative if requested
      let assignedRep: any = null;

      if (data.autoAssign) {
        const assignResult = await assignSalesRep({
          targetType: 'quotation',
          targetId: '', // will be set after creation
          autoAssign: true,
          factors: data.assignmentFactors,
        });
        if (assignResult.ok && assignResult.data) {
          assignedRep = assignResult.data;
          quotationCreateData.assignedTo = assignResult.data.userId;
        }
      } else if (data.assignedTo) {
        quotationCreateData.assignedTo = data.assignedTo;
      }

      const quotation = await quotationRepository.create(quotationCreateData);

      // Send lead assignment notification if auto-assigned
      if (assignedRep && assignedRep.userId) {
        const assignedUser = await userRepository.findById(assignedRep.userId);
        if (assignedUser?.email) {
          await dispatchNotification({
            type: 'lead_assignment',
            to: [assignedUser.email, 'manager@geelyethiopia.com'],
            subject: `New Quotation Assignment${quotation.reference ? ` (${quotation.reference})` : ''}`,
            data: {
              quotationId: quotation.id,
              quotationNo: quotation.reference,
              customerName: quotation.customerName,
              phoneNumber: quotation.phoneNumber,
              vehicleModel: quotation.vehicleModel,
              assignedTo: assignedUser.name,
            },
          });
        }
      }

      return { ok: true, data: quotation, assignedRep };
    } catch (error: any) {
      console.error('[QUOTATION CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create quotation.' };
    }
  },

  // Quotation has no per-lead `escalationTimeoutAt` column (create() no
  // longer pretends to write one — it never actually reached the database
  // under the old wiring, since Prisma would reject an unrecognized field).
  // The only real timestamp available to gauge "overdue" is createdAt, so
  // this uses a flat timeout window instead of a per-quotation deadline.
  async checkOverdueEscalations(timeoutMinutes = 60): Promise<{ ok: boolean; escalatedCount: number }> {
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - timeoutMinutes * 60 * 1000);
      // Find quotations that have sat unanswered past the timeout window and haven't been escalated yet
      const overdue = await prisma.quotation.findMany({
        where: {
          createdAt: { lte: cutoff },
          status: 'new',
          assignedTo: { not: null },
          escalatedAt: null,
        },
      });

      let escalatedCount = 0;

      for (const quotation of overdue) {
        // Find the next available sales rep
        const assignResult = await assignSalesRep({
          targetType: 'quotation',
          targetId: quotation.id,
          autoAssign: true,
        });

        if (assignResult.ok && assignResult.data) {
          // Escalate to the new rep
          await prisma.quotation.update({
            where: { id: quotation.id },
            data: {
              assignedTo: assignResult.data.userId,
              status: 'escalated',
              escalatedAt: now,
              escalatedFrom: quotation.assignedTo,
              escalationReason: `Auto-escalation after ${timeoutMinutes} minutes without a response.`,
            },
          });
          escalatedCount++;
        }
      }

      return { ok: true, escalatedCount };
    } catch (error: any) {
      console.error('[CHECK OVERDUE ESCALATIONS ERROR]', error.message);
      return { ok: false, escalatedCount: 0 };
    }
  },

  async list(params: {
    where?: any;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const [quotations, total, statusCounts] = await quotationRepository.findPage(params.where, skip, pageSize);

      return {
        ok: true,
        data: {
          quotations,
          total,
          statusCounts,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[QUOTATION LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch quotations.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.findById(id);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };
      return { ok: true, data: quotation };
    } catch (error: any) {
      console.error('[QUOTATION GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch quotation.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.update(id, data);
      return { ok: true, data: quotation };
    } catch (error: any) {
      console.error('[QUOTATION UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update quotation.' };
    }
  },

  async updateStatus(id: string, status: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.updateStatus(id, status);
      return { ok: true, data: quotation };
    } catch (error: any) {
      console.error('[QUOTATION STATUS ERROR]', error.message);
      return { ok: false, error: 'Failed to update quotation status.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await quotationRepository.delete(id);
      return { ok: true };
    } catch (error: any) {
      console.error('[QUOTATION DELETE ERROR]', error.message);
      return { ok: false, error: 'Failed to delete quotation.' };
    }
  },

  async assign(id: string, assignedTo: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.update(id, { assignedTo });
      return { ok: true, data: quotation };
    } catch (error: any) {
      console.error('[QUOTATION ASSIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to assign quotation.' };
    }
  },

  async getStatusByReference(reference: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.findByReferenceForStatus(reference);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };
      return { ok: true, data: quotation };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch quotation status.' };
    }
  },
};
