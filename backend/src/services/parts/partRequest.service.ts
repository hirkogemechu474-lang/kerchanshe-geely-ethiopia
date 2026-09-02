import { partRequestRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { sendPartsRequestEmail } from '../email/formEmail';

export const partRequestService = {
  async submit(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: Array<{ partName: string; quantity: number; notes?: string }>;
    additionalNotes?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reference = await generateReference(REFERENCE_CATEGORY.PARTS_REQUEST);

      // NOTE: PartRequest's real fields are name/email/phone/notes (not
      // customerName/customerEmail/customerPhone/additionalNotes), status is
      // a plain lowercase string per this model's convention ("new,
      // contacted, in_progress, quoted, closed" — not "SUBMITTED"), and
      // PartRequestItem has no per-line `notes` column.
      const request = await partRequestRepository.create({
        reference,
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        notes: data.additionalNotes,
        status: 'new',
        items: {
          create: data.items.map((item) => ({
            partName: item.partName,
            quantity: item.quantity,
          })),
        },
      });

      await sendPartsRequestEmail({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        items: data.items,
        additionalNotes: data.additionalNotes,
      });

      return { ok: true, data: request };
    } catch (error: any) {
      console.error('[PART REQUEST SUBMIT ERROR]', error.message);
      return { ok: false, error: 'Failed to submit parts request.' };
    }
  },

  async list(params?: { status?: string; category?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const requests = await partRequestRepository.findMany(params);
      return { ok: true, data: requests };
    } catch (error: any) {
      console.error('[PART REQUEST LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch parts requests.' };
    }
  },

  async listAdmin(params: { where: any; page?: number; pageSize?: number }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const [requests, total, statusCounts] = await partRequestRepository.findPage(params.where, skip, pageSize);

      return {
        ok: true,
        data: {
          requests,
          total,
          statusCounts,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch parts requests.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const request = await partRequestRepository.findById(id);
      if (!request) return { ok: false, error: 'Parts request not found.' };
      return { ok: true, data: request };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch parts request.' };
    }
  },

  async updateStatus(id: string, status: string, reviewedById: string, notes?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      // NOTE: PartRequest has no `reviewedById`/`reviewNotes` columns (no
      // reviewer-actor field exists on this model at all); the only
      // matching real field is `notes`.
      const request = await partRequestRepository.update(id, {
        status,
        ...(notes && { notes }),
      });

      return { ok: true, data: request };
    } catch (error: any) {
      console.error('[PART REQUEST UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update parts request.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await partRequestRepository.delete(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete parts request.' };
    }
  },

  async getStatusByReference(reference: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const request = await partRequestRepository.findByReferenceForStatus(reference);
      if (!request) return { ok: false, error: 'Parts request not found.' };
      return { ok: true, data: request };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch status.' };
    }
  },
};
