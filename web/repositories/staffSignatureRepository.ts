/**
 * StaffSignatureRepository — server-only Prisma queries for the staff
 * signature setup flow (User.signatureUrl / signatureSetupToken).
 */
import { prisma } from '@/lib/prisma';

export const staffSignatureRepository = {
  async findByToken(token: string) {
    return prisma.user.findUnique({ where: { signatureSetupToken: token } });
  },

  async completeSetup(userId: string, signatureUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        signatureUrl,
        signatureUpdatedAt: new Date(),
        signatureSetupToken: null,
        signatureSetupTokenExpiresAt: null,
      },
    });
  },
};
