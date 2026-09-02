import { prisma } from '../config/database';

export const newsletterRepository = {
  async findByEmail(email: string) {
    return prisma.newsletterSubscriber.findUnique({ where: { email } });
  },

  async upsertSubscribed(email: string) {
    return prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { status: 'subscribed' },
      create: { email, source: 'website' },
    });
  },
};
