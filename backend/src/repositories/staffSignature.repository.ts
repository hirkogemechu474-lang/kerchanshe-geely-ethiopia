import { prisma } from '../config/database';

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
