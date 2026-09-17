import { prisma } from '../config/database';

export const staffSignatureRepository = {
  async findByToken(token: string) {
    return prisma.user.findUnique({ where: { signatureSetupToken: token } });
  },

  async completeSetup(userId: string, signatureUrl: string, stampUrl?: string | null) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        signatureUrl,
        signatureUpdatedAt: new Date(),
        signatureSetupToken: null,
        signatureSetupTokenExpiresAt: null,
        // Optional — not every signatory has a company stamp/seal to attach.
        // undefined (not passed) leaves the existing stampUrl untouched; an
        // explicit null clears it.
        ...(stampUrl !== undefined ? { stampUrl } : {}),
      },
    });
  },
};
