import { quotationRepository, vehicleRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';

export const quotationService = {
  async create(data: {
    customerName: string;
    phoneNumber: string;
    email?: string;
    vehicleModel: string;
    vehicleId?: string;
    message?: string;
    assignedTo?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existingOpen = await quotationRepository.findOpenByPhone(data.phoneNumber);
      if (existingOpen) {
        return { ok: false, error: 'An open quotation already exists for this phone number.' };
      }

      const reference = await generateReference(REFERENCE_CATEGORY.QUOTATION);

      const quotation = await quotationRepository.create({
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        vehicleModel: data.vehicleModel,
        vehicleId: data.vehicleId,
        message: data.message,
        reference,
        status: 'new',
        ...(data.assignedTo && { assignedTo: data.assignedTo }),
      });

      return { ok: true, data: quotation };
    } catch (error: any) {
      console.error('[QUOTATION CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create quotation.' };
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
