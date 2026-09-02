import { jobCardRepository, serviceBayRepository } from '../../repositories';
import { prisma } from '../../config/database';

export const jobCardStateMachineService = {
  getValidTransitions(status: string): string[] {
    const transitions: Record<string, string[]> = {
      DRAFT_CHECKIN: ['CHECKED_IN', 'CANCELLED'],
      CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['QC_PENDING', 'CANCELLED'],
      QC_PENDING: ['QC_PASSED', 'IN_PROGRESS'],
      QC_PASSED: ['READY_FOR_PICKUP'],
      READY_FOR_PICKUP: ['INVOICED_CLOSED'],
      INVOICED_CLOSED: [],
      CANCELLED: [],
    };
    return transitions[status] ?? [];
  },

  canTransition(from: string, to: string): boolean {
    return this.getValidTransitions(from).includes(to);
  },

  async transition(jobCardId: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCard = await jobCardRepository.findById(jobCardId);
      if (!jobCard) return { ok: false, error: 'Job card not found.' };

      if (!this.canTransition(jobCard.status, toStatus)) {
        return { ok: false, error: `Invalid transition: ${jobCard.status} → ${toStatus}` };
      }

      const updateData: any = { status: toStatus };

      if (toStatus === 'CHECKED_IN') updateData.checkinTs = new Date();
      if (toStatus === 'INVOICED_CLOSED') updateData.closeTs = new Date();

      let freeBayId: string | null = null;
      if (toStatus === 'INVOICED_CLOSED' || toStatus === 'CANCELLED') {
        freeBayId = jobCard.bayId;
      }

      const result = await jobCardRepository.transitionStatus(
        jobCardId,
        jobCard.status as any,
        updateData,
        { toStatus: toStatus as any, changedById, reasonCode: reasonCode ?? null },
        freeBayId
      );

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[JOB CARD STATE MACHINE ERROR]', error.message);
      return { ok: false, error: 'Failed to transition job card.' };
    }
  },
};
