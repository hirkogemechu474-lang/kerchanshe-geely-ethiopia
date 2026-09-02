import { prisma } from '../../config/database';
import { userRepository } from '../../repositories';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '../email/smtp';
import { env } from '../../config/env';

export const passwordResetService = {
  async requestReset(email: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return { ok: true };
      }

      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Password Reset Request</h2>
          <p>Dear ${user.name},</p>
          <p>You requested a password reset. Use the code below to reset your password:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${otpCode}</span>
          </div>
          <p>This code expires in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;

      await sendEmail({ to: user.email, subject: 'Password Reset Code', html });

      return { ok: true };
    } catch (error: any) {
      console.error('[PASSWORD RESET REQUEST ERROR]', error.message);
      return { ok: false, error: 'Failed to process request.' };
    }
  },

  async verifyOtpAndReset(email: string, otp: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          email,
          otpCode: otp,
          otpExpiresAt: { gte: new Date() },
        },
      });

      if (!user) {
        return { ok: false, error: 'Invalid or expired OTP code.' };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          otpCode: null,
          otpExpiresAt: null,
        },
      });

      return { ok: true };
    } catch (error: any) {
      console.error('[PASSWORD RESET ERROR]', error.message);
      return { ok: false, error: 'Password reset failed.' };
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { ok: false, error: 'User not found.' };
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return { ok: false, error: 'Current password is incorrect.' };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { ok: true };
    } catch (error: any) {
      console.error('[CHANGE PASSWORD ERROR]', error.message);
      return { ok: false, error: 'Password change failed.' };
    }
  },
};
