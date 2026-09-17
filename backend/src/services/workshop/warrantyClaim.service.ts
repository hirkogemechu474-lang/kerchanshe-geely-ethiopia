import { warrantyClaimRepository, counterRepository, userRepository } from '../../repositories';
import { auditService } from '../audit/audit.service';
import { dispatchNotification } from '../email/notifications.dispatch';
import { prisma } from '../../config/database';

export const warrantyClaimService = {
  async list(status?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const claims = await warrantyClaimRepository.findMany(status as any);
      return { ok: true, data: claims };
    } catch (error: any) {
      console.error('[WARRANTY CLAIM LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch warranty claims.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const claim = await warrantyClaimRepository.findByIdWithDetail(id);
      if (!claim) return { ok: false, error: 'Warranty claim not found.' };
      return { ok: true, data: claim };
    } catch (error: any) {
      console.error('[WARRANTY CLAIM GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch warranty claim.' };
    }
  },

  async create(data: {
    jobCardId: string;
    defectCode: string;
    description?: string;
    component?: string;
    diagnosticCodes?: string;
    createdById: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      // claimNo has no default in the schema (like jobCardNo, it's generated
      // from a shared counter). WarrantyClaim also has no createdById/
      // partsCost/laborCost columns (who filed the claim and any cost
      // breakdown aren't tracked on the model itself), so data.createdById
      // isn't persisted here.
      const counter = await counterRepository.upsert('warrantyClaim', 1001);
      const claimNo = `WC-${counter.value}`;

      const claim = await warrantyClaimRepository.create({
        claimNo,
        jobCard: { connect: { id: data.jobCardId } },
        defectCode: data.defectCode,
        status: 'DRAFTED',
        ...(data.description !== undefined && { description: data.description }),
        ...(data.component !== undefined && { component: data.component }),
        ...(data.diagnosticCodes !== undefined && { diagnosticCodes: data.diagnosticCodes }),
      });

      return { ok: true, data: claim };
    } catch (error: any) {
      console.error('[WARRANTY CLAIM CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create warranty claim.' };
    }
  },

  async transitionStatus(id: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const claim = await warrantyClaimRepository.findById(id);
      if (!claim) return { ok: false, error: 'Warranty claim not found.' };

      // Keys/values must match the real WarrantyClaimStatus enum
      // (DRAFTED/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/REIMBURSED) —
      // there is no CANCELLED or PAID status on this model.
      const transitions: Record<string, string[]> = {
        DRAFTED: ['SUBMITTED'],
        SUBMITTED: ['UNDER_REVIEW'],
        UNDER_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: ['REIMBURSED'],
        REJECTED: [],
        REIMBURSED: [],
      };

      if (!transitions[claim.status]?.includes(toStatus)) {
        return { ok: false, error: `Invalid transition: ${claim.status} → ${toStatus}` };
      }

      const result = await warrantyClaimRepository.transitionStatus(
        id,
        { status: toStatus as any },
        {
          fromStatus: claim.status,
          toStatus: toStatus as any,
          changedById,
          reasonCode: reasonCode ?? null,
        }
      );

      await auditService.log({
        entityType: 'warranty',
        entityId: id,
        action: 'status_changed',
        performedById: changedById,
        fromValue: { status: claim.status },
        toValue: { status: toStatus },
        reason: reasonCode,
      });

      // Send notification on key status changes
      if (toStatus === 'APPROVED' || toStatus === 'REJECTED') {
        try {
          // Find the job card's associated customer via service booking or order
          const jobCard = await prisma.jobCard.findUnique({
            where: { id: claim.jobCardId },
            select: { customerName: true, customerPhone: true, customerEmail: true, jobCardNo: true },
          });

          if (jobCard?.customerEmail) {
            const subject = toStatus === 'APPROVED'
              ? `Warranty Claim Approved — ${claim.claimNo}`
              : `Warranty Claim Update — ${claim.claimNo}`;

            await dispatchNotification({
              type: 'warranty_claim',
              to: [jobCard.customerEmail],
              subject,
              data: {
                claimNo: claim.claimNo,
                jobCardNo: jobCard.jobCardNo,
                customerName: jobCard.customerName,
                status: toStatus,
                defectCode: claim.defectCode,
              },
            });
          }

          // Step 21: Also notify service team about warranty claim status change
          const serviceTeam = await prisma.user.findMany({ where: { role: { in: ['service', 'service_manager', 'service_advisor', 'technician', 'admin'] }, isActive: true }, select: { email: true } });
          // Also broadcast to the workshop-manager roles (workshop_manager,
          // service_manager, after_sales_manager, admin) as an additional
          // recipient list, alongside the existing technician/service_advisor
          // lookup above — not a replacement for it.
          const workshopManagerEmails = await userRepository.findWorkshopManagerEmails();
          const serviceEmails = [...new Set([...serviceTeam.map(s => s.email).filter(Boolean), ...workshopManagerEmails])];
          if (serviceEmails.length > 0) {
            const serviceSubject = toStatus === 'APPROVED'
              ? `Warranty Claim Approved — ${claim.claimNo}`
              : `Warranty Claim Status Update — ${claim.claimNo}`;
            await dispatchNotification({
              type: 'warranty_claim',
              to: serviceEmails,
              subject: serviceSubject,
              data: {
                claimNo: claim.claimNo,
                jobCardNo: jobCard?.jobCardNo || 'N/A',
                customerName: jobCard?.customerName || 'N/A',
                status: toStatus,
                defectCode: claim.defectCode,
              },
              inApp: {
                type: 'warranty_claim',
                title: `Warranty Claim ${toStatus}`,
                body: `Warranty claim ${claim.claimNo} for job card ${jobCard?.jobCardNo || 'N/A'} has been ${toStatus.toLowerCase()}.`,
                relatedModel: 'warrantyClaim',
                relatedId: claim.id,
                priority: toStatus === 'APPROVED' ? 'normal' : 'high',
              },
            });
          }
        } catch (notifyError: any) {
          console.error('[WARRANTY CLAIM NOTIFICATION ERROR]', notifyError.message);
        }
      }

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[WARRANTY CLAIM TRANSITION ERROR]', error.message);
      return { ok: false, error: 'Failed to update warranty claim status.' };
    }
  },
};
