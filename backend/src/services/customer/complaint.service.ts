import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';
import { auditService } from '../audit/audit.service';
import { userRepository } from '../../repositories';

export const complaintService = {
  /**
   * Create a new customer complaint/case.
   */
  async create(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    orderId?: string;
    vehicleModel?: string;
    vin?: string;
    category: string; // VEHICLE_ISSUE | SERVICE_QUALITY | BILLING | STAFF_CONDUCT | DELIVERY | OTHER
    priority: string; // LOW | MEDIUM | HIGH | CRITICAL
    subject: string;
    description: string;
    source: string; // PHONE | EMAIL | WALK_IN | ONLINE | SOCIAL_MEDIA
    assignedTo?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      // Generate case number
      const caseCount = await prisma.complaintCase.count();
      const caseNo = `CASE-${String(caseCount + 1).padStart(5, '0')}`;

      const caseRecord = await prisma.complaintCase.create({
        data: {
          caseNo,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          orderId: data.orderId || null,
          vehicleModel: data.vehicleModel || null,
          vin: data.vin || null,
          category: data.category,
          priority: data.priority,
          subject: data.subject,
          description: data.description,
          source: data.source,
          status: 'OPEN',
          assignedTo: data.assignedTo || null,
        },
      });

      // Log audit
      await auditService.log({
        entityType: 'complaint',
        entityId: caseRecord.id,
        action: 'created',
        performedById: data.assignedTo || 'system',
        toValue: { caseNo, category: data.category, priority: data.priority, subject: data.subject },
      });

      // Notify manager if high priority
      if (data.priority === 'HIGH' || data.priority === 'CRITICAL') {
        const managerEmails = await userRepository.findManagerEmails();
        await dispatchNotification({
          type: 'complaint_created',
          to: managerEmails,
          subject: `[${data.priority}] New Customer Complaint: ${data.subject}`,
          data: {
            caseNo,
            customerName: data.customerName,
            category: data.category,
            priority: data.priority,
            subject: data.subject,
          },
          inApp: {
            type: 'complaint_created',
            title: `[${data.priority}] New Customer Complaint`,
            body: `A new ${data.priority.toLowerCase()} priority complaint has been created by ${data.customerName}: "${data.subject}" (${data.category}). Case No: ${caseNo}. Please review and assign action.`,
            link: `/admin/customers/complaints`,
            relatedModel: 'complaint',
            relatedId: caseRecord.id,
            priority: data.priority === 'CRITICAL' ? 'urgent' : 'high',
          },
        });
      }

      return { ok: true, data: caseRecord };
    } catch (error: any) {
      console.error('[COMPLAINT CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create complaint.' };
    }
  },

  /**
   * Update complaint status.
   */
  async updateStatus(
    caseId: string,
    status: string, // OPEN | IN_PROGRESS | PENDING_CUSTOMER | PENDING_INTERNAL | RESOLVED | CLOSED | REOPENED
    changedById: string,
    note?: string
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await prisma.complaintCase.findUnique({ where: { id: caseId } });
      if (!existing) return { ok: false, error: 'Case not found.' };

      const updated = await prisma.complaintCase.update({
        where: { id: caseId },
        data: {
          status: status as any,
          ...(status === 'RESOLVED' && { resolvedAt: new Date(), resolvedById: changedById }),
          ...(status === 'CLOSED' && { closedAt: new Date() }),
        },
      });

      // Add internal note
      if (note) {
        await prisma.complaintNote.create({
          data: {
            caseId,
            noteType: 'INTERNAL',
            content: note,
            createdBy: changedById,
          },
        });
      }

      // Log status change
      await auditService.log({
        entityType: 'complaint',
        entityId: caseId,
        action: 'status_changed',
        performedById: changedById,
        fromValue: { status: existing.status },
        toValue: { status },
        reason: note,
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[COMPLAINT UPDATE STATUS ERROR]', error.message);
      return { ok: false, error: 'Failed to update complaint status.' };
    }
  },

  /**
   * Add a note to a complaint.
   */
  async addNote(
    caseId: string,
    data: {
      noteType: string; // INTERNAL | CUSTOMER_COMMUNICATION | RESOLUTION
      content: string;
      createdBy: string;
      isPublic?: boolean;
    }
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const note = await prisma.complaintNote.create({
        data: {
          caseId,
          noteType: data.noteType,
          content: data.content,
          createdBy: data.createdBy,
          isPublic: data.isPublic || false,
        },
      });

      return { ok: true, data: note };
    } catch (error: any) {
      console.error('[COMPLAINT ADD NOTE ERROR]', error.message);
      return { ok: false, error: 'Failed to add note.' };
    }
  },

  /**
   * Get complaint details with notes.
   */
  async getById(caseId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const caseRecord = await prisma.complaintCase.findUnique({
        where: { id: caseId },
        include: {
          notes: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (!caseRecord) return { ok: false, error: 'Case not found.' };

      return { ok: true, data: caseRecord };
    } catch (error: any) {
      console.error('[COMPLAINT GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch complaint.' };
    }
  },

  /**
   * List complaints with filters.
   */
  async list(params: {
    status?: string;
    category?: string;
    priority?: string;
    assignedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (params.status) where.status = params.status;
      if (params.category) where.category = params.category;
      if (params.priority) where.priority = params.priority;
      if (params.assignedTo) where.assignedTo = params.assignedTo;

      const [cases, total] = await Promise.all([
        prisma.complaintCase.findMany({
          where,
          orderBy: [
            { priority: 'asc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: pageSize,
        }),
        prisma.complaintCase.count({ where }),
      ]);

      return {
        ok: true,
        data: {
          cases,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[COMPLAINT LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch complaints.' };
    }
  },

  /**
   * Get complaint dashboard metrics.
   */
  async getDashboard(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [open, inProgress, resolved, closed, critical, high] = await Promise.all([
        prisma.complaintCase.count({ where: { status: 'OPEN' } }),
        prisma.complaintCase.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.complaintCase.count({ where: { status: 'RESOLVED' } }),
        prisma.complaintCase.count({ where: { status: 'CLOSED' } }),
        prisma.complaintCase.count({ where: { priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
        prisma.complaintCase.count({ where: { priority: 'HIGH', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      ]);

      const byCategory = await prisma.complaintCase.groupBy({
        by: ['category'],
        where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
        _count: true,
      });

      return {
        ok: true,
        data: {
          open, inProgress, resolved, closed, critical, high,
          totalActive: open + inProgress,
          byCategory,
        },
      };
    } catch (error: any) {
      console.error('[COMPLAINT DASHBOARD ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch complaint dashboard.' };
    }
  },
};