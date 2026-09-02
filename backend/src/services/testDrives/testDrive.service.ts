import { testDriveRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';

export const testDriveService = {
  async list(params?: { status?: string; startDate?: string; endDate?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const testDrives = await testDriveRepository.findMany(params);
      return { ok: true, data: testDrives };
    } catch (error: any) {
      console.error('[TEST DRIVE LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch test drives.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const testDrive = await testDriveRepository.findByIdWithVehicle(id);
      if (!testDrive) return { ok: false, error: 'Test drive not found.' };
      return { ok: true, data: testDrive };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch test drive.' };
    }
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const testDrive = await testDriveRepository.update(id, {
        status,
        ...(notes && { notes }),
      });
      return { ok: true, data: testDrive };
    } catch (error: any) {
      console.error('[TEST DRIVE UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update test drive.' };
    }
  },

  async getStatusByReference(reference: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const testDrive = await testDriveRepository.findByReferenceForStatus(reference);
      if (!testDrive) return { ok: false, error: 'Test drive not found.' };
      return { ok: true, data: testDrive };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch status.' };
    }
  },
};
