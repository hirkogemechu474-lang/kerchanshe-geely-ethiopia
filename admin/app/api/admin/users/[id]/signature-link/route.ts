import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

/**
 * POST /api/admin/users/[id]/signature-link
 *
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
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.user.update({
    where: { id },
    data: { signatureSetupToken: token, signatureSetupTokenExpiresAt: expiresAt },
  });

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

  return NextResponse.json({ notificationSent, signatureUrl });
}
