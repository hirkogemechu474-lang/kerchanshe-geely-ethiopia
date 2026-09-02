import { warrantyClaimRepository } from '../../repositories';

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
    description: string;
    partsCost?: number;
    laborCost?: number;
    createdById: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const claim = await warrantyClaimRepository.create({
        jobCard: { connect: { id: data.jobCardId } },
        description: data.description,
        status: 'DRAFT',
        createdById: data.createdById,
        ...(data.partsCost !== undefined && { partsCost: data.partsCost }),
        ...(data.laborCost !== undefined && { laborCost: data.laborCost }),
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

      const transitions: Record<string, string[]> = {
        DRAFT: ['SUBMITTED', 'CANCELLED'],
        SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
        UNDER_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: ['PAID'],
        REJECTED: [],
        PAID: [],
        CANCELLED: [],
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

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[WARRANTY CLAIM TRANSITION ERROR]', error.message);
      return { ok: false, error: 'Failed to update warranty claim status.' };
    }
  },
};
