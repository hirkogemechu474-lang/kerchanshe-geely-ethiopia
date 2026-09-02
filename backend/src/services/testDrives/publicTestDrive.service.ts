import { testDriveRepository, vehicleRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { sendTestDriveConfirmationEmail } from '../email/statusEmail';

export const publicTestDriveService = {
  async request(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleId: string;
    preferredDate: string;
    preferredTime: string;
    location?: string;
    notes?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await vehicleRepository.findById(data.vehicleId);
      if (!vehicle) return { ok: false, error: 'Vehicle not found.' };

      const reference = await generateReference(REFERENCE_CATEGORY.TEST_DRIVE);

      const testDrive = await testDriveRepository.create({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        vehicle: { connect: { id: data.vehicleId } },
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        location: data.location || '',
        specialRequests: data.notes,
        reference,
        status: 'PENDING',
      });

      await sendTestDriveConfirmationEmail({
        to: data.customerEmail,
        customerName: data.customerName,
        reference,
        vehicleName: vehicle.name,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
      });

      return { ok: true, data: testDrive };
    } catch (error: any) {
      console.error('[PUBLIC TEST DRIVE REQUEST ERROR]', error.message);
      return { ok: false, error: 'Failed to request test drive.' };
    }
  },

  async confirm(id: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const testDrive = await testDriveRepository.findById(id);
      if (!testDrive) return { ok: false, error: 'Test drive not found.' };

      const { verifyLinkToken } = await import('../../utils/secureLink');
      if (!verifyLinkToken(token, 'quotation', id)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const updated = await testDriveRepository.update(id, { status: 'CONFIRMED' });
      return { ok: true, data: updated };
    } catch (error: any) {
      return { ok: false, error: 'Failed to confirm test drive.' };
    }
  },
};
