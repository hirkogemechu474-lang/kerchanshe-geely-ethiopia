import apiClient from '@/lib/apiClient';

export const reviewsService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/reviews${q}`);
    return data;
  },
  approve: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/reviews/${id}/approve`);
    return data;
  },
  reject: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/reviews/${id}/reject`);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/reviews/${id}`);
  },
};
