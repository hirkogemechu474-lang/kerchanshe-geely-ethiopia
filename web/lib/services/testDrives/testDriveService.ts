import { testDriveRepository } from '@/repositories/testDriveRepository';

export type ConfirmResult =
  | { ok: true; status: string }
  | { ok: false; httpStatus: 404 | 409; error: string };

// Public — the customer's side of a sales-agent-initiated test-drive invite
// (see admin/app/api/admin/orders/[id]/send-test-drive/route.ts). One-way:
// only a 'pending' test drive can be confirmed, matching the
// agreement/handover sign routes' "already done" 409 guard.
export async function confirmTestDrive(id: string): Promise<ConfirmResult> {
  const testDrive = await testDriveRepository.findById(id);
  if (!testDrive) {
    return { ok: false, httpStatus: 404, error: 'Test drive not found' };
  }
  if (testDrive.status !== 'pending') {
    return { ok: false, httpStatus: 409, error: `This test drive is already ${testDrive.status}.` };
  }

  const updated = await testDriveRepository.updateStatus(id, 'confirmed');
  return { ok: true, status: updated.status };
}
