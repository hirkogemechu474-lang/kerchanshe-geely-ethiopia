import { prisma } from '../config/database';

export const inAppNotificationRepository = {
  async create(data: {
    recipientId: string;
    recipientEmail: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    quotationId?: string;
    orderId?: string;
    relatedModel?: string;
    relatedId?: string;
    priority?: string;
  }) {
    return prisma.inAppNotification.create({ data });
  },

  async createMany(notifications: Array<{
    recipientId: string;
    recipientEmail: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    quotationId?: string;
    orderId?: string;
    relatedModel?: string;
    relatedId?: string;
    priority?: string;
  }>) {
    if (notifications.length === 0) return [];
    return prisma.inAppNotification.createMany({ data: notifications });
  },

  async findByUser(recipientId: string, options?: { unreadOnly?: boolean; limit?: number; offset?: number }) {
    const where: any = { recipientId };
    if (options?.unreadOnly) where.readAt = null;

    return prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  },

  async countUnread(recipientId: string) {
    return prisma.inAppNotification.count({
      where: { recipientId, readAt: null },
    });
  },

  async markAsRead(id: string, recipientId: string) {
    return prisma.inAppNotification.updateMany({
      where: { id, recipientId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  async markAllAsRead(recipientId: string) {
    return prisma.inAppNotification.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  async findRecentByRecipientAndType(recipientId: string, type: string, relatedId: string, withinMinutes: number = 5) {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    return prisma.inAppNotification.findFirst({
      where: {
        recipientId,
        type,
        relatedId,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
