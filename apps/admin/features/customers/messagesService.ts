import apiClient from '@/lib/apiClient';

export const messagesService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/messages${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/messages/${id}`);
    return data;
  },
  markAsRead: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/messages/${id}/read`);
    return data;
  },
  reply: async (id: string, replyText: string) => {
    const { data } = await apiClient.post(`/admin/messages/${id}/reply`, { reply: replyText });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/messages/${id}`);
  },
};
