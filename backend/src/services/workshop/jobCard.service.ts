import { jobCardRepository, customerRepository, customerVehicleRepository, serviceBayRepository } from '../../repositories';

export const jobCardStateMachine = {
  validTransitions: {
    DRAFT_CHECKIN: ['CHECKED_IN', 'CANCELLED'],
    CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['QC_PENDING', 'CANCELLED'],
    QC_PENDING: ['QC_PASSED', 'IN_PROGRESS'],
    QC_PASSED: ['READY_FOR_PICKUP'],
    READY_FOR_PICKUP: ['INVOICED_CLOSED'],
    INVOICED_CLOSED: [],
    CANCELLED: [],
  } as Record<string, string[]>,

  canTransition(from: string, to: string): boolean {
    return this.validTransitions[from]?.includes(to) ?? false;
  },

  getValidTransitions(status: string): string[] {
    return this.validTransitions[status] ?? [];
  },
};

export const jobCardService = {
  async create(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    vehicleModel: string;
    plateNo?: string;
    vin?: string;
    complaintText: string;
    technicianId?: string;
    bayId?: string;
    scheduledStart?: Date;
    createdById: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCardNo = await jobCardRepository.nextJobCardNo();

      let customerVehicleId: string | undefined;
      if (data.vin || data.plateNo) {
        const existingVehicle = data.vin
          ? await customerVehicleRepository.findByVin(data.vin)
          : await customerVehicleRepository.findByPlateNo(data.plateNo!);

        if (existingVehicle) {
          customerVehicleId = existingVehicle.id;
        }
      }

      const jobCard = await jobCardRepository.create({
        jobCardNo,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        vehicleModel: data.vehicleModel,
        plateNo: data.plateNo,
        vin: data.vin,
        complaintText: data.complaintText,
        status: 'DRAFT_CHECKIN',
        openTs: new Date(),
        createdById: data.createdById,
        ...(data.technicianId && { technicianId: data.technicianId }),
        ...(data.bayId && { bayId: data.bayId }),
        ...(data.scheduledStart && { scheduledStart: data.scheduledStart }),
        ...(customerVehicleId && { customerVehicleId }),
      });

      return { ok: true, data: jobCard };
    } catch (error: any) {
      console.error('[JOB CARD CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create job card.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCard = await jobCardRepository.findByIdWithDetail(id);
      if (!jobCard) return { ok: false, error: 'Job card not found.' };
      return { ok: true, data: jobCard };
    } catch (error: any) {
      console.error('[JOB CARD GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch job card.' };
    }
  },

  async list(params: { where: any }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCards = await jobCardRepository.findMany(params.where);
      return { ok: true, data: jobCards };
    } catch (error: any) {
      console.error('[JOB CARD LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch job cards.' };
    }
  },

  async listForBoard(dayStart: Date, dayEnd: Date): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCards = await jobCardRepository.findManyForBoard(dayStart, dayEnd);
      return { ok: true, data: jobCards };
    } catch (error: any) {
      console.error('[JOB CARD BOARD ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch job cards for board.' };
    }
  },

  async transitionStatus(id: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCard = await jobCardRepository.findById(id);
      if (!jobCard) return { ok: false, error: 'Job card not found.' };

      if (!jobCardStateMachine.canTransition(jobCard.status, toStatus)) {
        return { ok: false, error: `Cannot transition from ${jobCard.status} to ${toStatus}.` };
      }

      const updateData: any = { status: toStatus };

      if (toStatus === 'CHECKED_IN') {
        updateData.checkinTs = new Date();
      } else if (toStatus === 'INVOICED_CLOSED') {
        updateData.closeTs = new Date();
      }

      let freeBayId: string | null = null;
      if (toStatus === 'INVOICED_CLOSED' || toStatus === 'CANCELLED') {
        freeBayId = jobCard.bayId;
      }

      const result = await jobCardRepository.transitionStatus(
        id,
        jobCard.status as any,
        updateData,
        {
          toStatus: toStatus as any,
          changedById,
          reasonCode: reasonCode ?? null,
        },
        freeBayId
      );

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[JOB CARD TRANSITION ERROR]', error.message);
      return { ok: false, error: 'Failed to update job card status.' };
    }
  },

  async assignTechnicianAndBay(id: string, technicianId?: string, bayId?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCard = await jobCardRepository.findById(id);
      if (!jobCard) return { ok: false, error: 'Job card not found.' };

      const previousBayId = jobCard.bayId;

      const result = await jobCardRepository.assignTechnicianBay(
        id,
        {
          ...(technicianId !== undefined && { technicianId }),
          ...(bayId !== undefined && { bayId }),
        },
        previousBayId,
        bayId || null
      );

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[JOB CARD ASSIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to assign technician/bay.' };
    }
  },

  async countDraftCheckinToday(): Promise<{ ok: boolean; data?: number; error?: string }> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const count = await jobCardRepository.countDraftCheckinToday(todayStart, todayEnd);
      return { ok: true, data: count };
    } catch (error: any) {
      return { ok: false, error: 'Failed to count draft check-ins.' };
    }
  },
};
