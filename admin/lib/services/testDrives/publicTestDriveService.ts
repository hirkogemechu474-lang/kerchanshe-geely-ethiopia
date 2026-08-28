import { messageRepository } from '@/repositories/messageRepository';
import { sendStatusEmail } from '@/lib/status-email';

export type SubmitPublicTestDriveResult =
  | { ok: true; testDrive: any; notificationSent: boolean }
  | { ok: false; error: string };

// POST /api/public/test-drive — submit test drive request from Web frontend.
// There is no dedicated table for this public channel — it reuses the same
// generic Message-backed pattern as other public lead-capture forms.
export async function submitPublicTestDrive(body: any): Promise<SubmitPublicTestDriveResult> {
  const { firstName, lastName, email, phone, vehicleInterest, dealerPreference, preferredDate, preferredTime, message } = body;

  if (!firstName || !lastName || !email || !phone || !vehicleInterest) {
    return { ok: false, error: 'Missing required fields' };
  }

  const testDrive = await messageRepository.create({
    from: `${firstName} ${lastName}`.trim(),
    email,
    subject: `Test drive request: ${vehicleInterest}`,
    category: 'Test Drive',
    priority: 'medium',
    status: 'unread',
    content: JSON.stringify({
      phone,
      vehicleInterest,
      dealerPreference,
      preferredDate,
      preferredTime,
      message,
    }),
  });

  let notificationSent = false;
  try {
    notificationSent = await sendStatusEmail({
      to: email,
      name: `${firstName} ${lastName}`.trim(),
      entityType: 'test-drive request',
      status: 'RECEIVED',
      reference: testDrive.id,
      details: `Vehicle: ${vehicleInterest}\nDealer: ${dealerPreference || 'Not specified'}\nPreferred time: ${preferredDate || 'Not specified'} ${preferredTime || ''}`,
    });
  } catch (emailError) {
    console.error('[public:test-drive:email]', emailError);
  }

  return { ok: true, testDrive, notificationSent };
}
