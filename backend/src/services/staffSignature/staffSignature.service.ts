import { staffSignatureRepository, userRepository } from '../../repositories';
import crypto from 'crypto';
import { sendEmail } from '../email/smtp';
import { env } from '../../config/env';

export const staffSignatureService = {
  async initiateSetup(userId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) return { ok: false, error: 'User not found.' };

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await userRepository.updateSignatureSetupToken(userId, token, expiresAt);

      const setupUrl = `${env.urls.admin}/signature/setup?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: 'Signature Setup Link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Signature Setup</h2>
            <p>Dear ${user.name},</p>
            <p>Click the link below to set up your digital signature:</p>
            <a href="${setupUrl}" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0;">Setup Signature</a>
            <p>This link expires in 24 hours.</p>
          </div>
        `,
      });

      return { ok: true };
    } catch (error: any) {
      console.error('[SIGNATURE SETUP ERROR]', error.message);
      return { ok: false, error: 'Failed to initiate signature setup.' };
    }
  },

  async completeSetup(token: string, signatureUrl: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const user = await staffSignatureRepository.findByToken(token);
      if (!user) return { ok: false, error: 'Invalid or expired token.' };

      if (user.signatureSetupTokenExpiresAt && user.signatureSetupTokenExpiresAt < new Date()) {
        return { ok: false, error: 'Token has expired.' };
      }

      const updated = await staffSignatureRepository.completeSetup(user.id, signatureUrl);
      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[SIGNATURE COMPLETE ERROR]', error.message);
      return { ok: false, error: 'Failed to complete signature setup.' };
    }
  },
};
