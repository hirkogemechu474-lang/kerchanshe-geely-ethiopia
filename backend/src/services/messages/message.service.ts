import { messageRepository } from '../../repositories';

export const messageService = {
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    category?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const msg = await messageRepository.create({
        from: data.name,
        email: data.email,
        subject: data.subject,
        content: data.message,
        category: data.category || 'general',
        status: 'unread',
      });

      return { ok: true, data: msg };
    } catch (error: any) {
      console.error('[MESSAGE CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to send message.' };
    }
  },

  async list(params?: { status?: string; category?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const messages = await messageRepository.findMany(params);
      return { ok: true, data: messages };
    } catch (error: any) {
      console.error('[MESSAGE LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch messages.' };
    }
  },

  async markAsRead(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const message = await messageRepository.update(id, { status: 'read' });
      return { ok: true, data: message };
    } catch (error: any) {
      return { ok: false, error: 'Failed to mark message as read.' };
    }
  },

  async markAsReplied(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const message = await messageRepository.update(id, { status: 'replied' });
      return { ok: true, data: message };
    } catch (error: any) {
      return { ok: false, error: 'Failed to mark message as replied.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await messageRepository.update(id, { status: 'deleted' });
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete message.' };
    }
  },

  async getByCategory(category: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const messages = await messageRepository.findManyByCategory(category);
      return { ok: true, data: messages };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch messages.' };
    }
  },
};
