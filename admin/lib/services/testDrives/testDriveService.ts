import { testDriveRepository } from '@/repositories/testDriveRepository';
import { sendStatusEmail } from '@/lib/status-email';

export interface UpdateTestDriveInput {
  status?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idPhotoUrl?: string;
}

export type UpdateTestDriveResult =
  | { ok: true; testDrive: any }
  | { ok: false; httpStatus: 400 | 404 | 409; error: string };

export async function updateTestDrive(id: string, input: UpdateTestDriveInput, actingUserId: string): Promise<UpdateTestDriveResult> {
  if (input.status !== undefined && !['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(input.status)) {
    return { ok: false, httpStatus: 400, error: 'Invalid status' };
  }

  const existing = await testDriveRepository.findById(id);
  if (!existing) {
    return { ok: false, httpStatus: 404, error: 'Test drive not found' };
  }

  // FR-104 accountability gate: a test drive cannot be marked completed
  // until the customer's ID has been captured — checking against the
  // photo that will exist AFTER this request's own ID fields are applied,
  // so capturing the ID and completing the drive can happen in one PATCH.
  const idPhotoAfterUpdate = input.idPhotoUrl !== undefined ? input.idPhotoUrl : existing.idPhotoUrl;
  if (input.status === 'completed' && !idPhotoAfterUpdate) {
    return { ok: false, httpStatus: 409, error: "Capture the customer's ID before marking this test drive complete." };
  }

  const isFirstIdCapture = input.idPhotoUrl !== undefined && Boolean(input.idPhotoUrl) && !existing.idPhotoUrl;

  const testDrive = await testDriveRepository.update(id, {
    ...(input.status !== undefined && { status: input.status }),
    ...(input.idDocumentType !== undefined && { idDocumentType: input.idDocumentType || null }),
    ...(input.idDocumentNumber !== undefined && { idDocumentNumber: input.idDocumentNumber || null }),
    ...(input.idPhotoUrl !== undefined && { idPhotoUrl: input.idPhotoUrl || null }),
    ...(isFirstIdCapture && { idVerifiedAt: new Date(), idVerifiedById: actingUserId }),
  });

  if (input.status && ['confirmed', 'cancelled', 'completed'].includes(input.status)) {
    try {
      await sendStatusEmail({
        to: testDrive.customerEmail,
        name: testDrive.customerName,
        entityType: 'Test Drive Request',
        status: input.status,
        reference: testDrive.id,
        details: `Vehicle: ${testDrive.vehicleId}\nPreferred time: ${testDrive.preferredTime}\nLocation: ${testDrive.location}`,
      });
    } catch (error) {
      console.error('[status-email] test-drive', error);
    }
  }

  return { ok: true, testDrive };
}
