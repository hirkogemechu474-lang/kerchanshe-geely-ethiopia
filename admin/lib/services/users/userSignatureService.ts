import crypto from 'crypto';
import { userRepository } from '@/repositories/userRepository';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

export type SendSignatureLinkResult =
  | { ok: true; notificationSent: boolean; signatureUrl: string }
  | { ok: false; httpStatus: 404; error: string };

/**
 * Generates a one-time, time-limited link and emails it to a staff member
 * (any admin-panel role — sales agents and managers are the primary use
 * case, but nothing here restricts it to those roles) so they can draw or
 * upload their own signature at web/app/staff-signature/[token]. Once set,
 * SalesOrder countersign actions (agreement + handover) stamp that actual
 * signature image onto the document instead of just the person's typed
 * name — see web/app/api/agreement/[orderId]/countersign-stamp.
 *
 * Same shape as the existing password-reset OTP (User.otpCode/otpExpiry):
 * a random value + expiry stored on the user, cleared once used — just
 * link-based instead of a code the person types in.
 */
export async function sendStaffSignatureLink(userId: string): Promise<SendSignatureLinkResult> {
  const user = await userRepository.findByIdFull(userId);
  if (!user) {
    return { ok: false, httpStatus: 404, error: 'User not found' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await userRepository.updateSignatureSetupToken(userId, token, expiresAt);

  const siteUrl = env.app.url.replace(/\/$/, '');
  const signatureUrl = `${siteUrl}/staff-signature/${token}`;

  let notificationSent = false;
  try {
    notificationSent = await sendStatusEmail({
      to: user.email,
      name: user.name,
      entityType: 'signature setup',
      status: 'requested',
      details: 'Please draw or upload your signature — it will be used automatically whenever you countersign a sales agreement or vehicle handover. This link expires in 7 days.',
      actionUrl: signatureUrl,
      actionLabel: 'Set Up My Signature',
    });
  } catch (emailError) {
    console.error('[users:signature-link:email]', emailError);
  }

  return { ok: true, notificationSent, signatureUrl };
}
