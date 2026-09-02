import { showroomVisitRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';

export const showroomVisitService = {
  async startVisit(ipAddress: string | null, userAgent: string | null): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const visit = await showroomVisitRepository.create({ ipAddress, userAgent });
      return { ok: true, data: visit };
    } catch (error: any) {
      console.error('[SHOWROOM VISIT START ERROR]', error.message);
      return { ok: false, error: 'Failed to start showroom visit.' };
    }
  },

  async register(visitId: string, data: {
    fullName: string;
    phone: string;
    email?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const visit = await showroomVisitRepository.updateRegistration(visitId, {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        status: 'registered',
        registeredAt: new Date(),
      });

      return { ok: true, data: visit };
    } catch (error: any) {
      console.error('[SHOWROOM VISIT REGISTER ERROR]', error.message);
      return { ok: false, error: 'Failed to register visit.' };
    }
  },

  async selectAction(visitId: string, selectedAction: string, testDriveId?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const visit = await showroomVisitRepository.updateSelectedAction(visitId, selectedAction, testDriveId);
      return { ok: true, data: visit };
    } catch (error: any) {
      console.error('[SHOWROOM VISIT ACTION ERROR]', error.message);
      return { ok: false, error: 'Failed to update visit action.' };
    }
  },

  async list(params?: { status?: string; page?: number; pageSize?: number }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where = params?.status ? { status: params.status } : undefined;

      const [visits, total, statusCounts] = await showroomVisitRepository.findPage(where, skip, pageSize);

      return {
        ok: true,
        data: { visits, total, statusCounts, page, pageSize },
      };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch visits.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const visit = await showroomVisitRepository.findById(id);
      if (!visit) return { ok: false, error: 'Visit not found.' };
      return { ok: true, data: visit };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch visit.' };
    }
  },

  async linkQuotation(visitId: string, quotationId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const visit = await showroomVisitRepository.linkQuotation(visitId, quotationId);
      return { ok: true, data: visit };
    } catch (error: any) {
      return { ok: false, error: 'Failed to link quotation.' };
    }
  },

  async linkQuotationAndOrder(visitId: string, quotationId: string, salesOrderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const visit = await showroomVisitRepository.linkQuotationAndOrder(visitId, quotationId, salesOrderId);
      return { ok: true, data: visit };
    } catch (error: any) {
      return { ok: false, error: 'Failed to link quotation and order.' };
    }
  },
};
