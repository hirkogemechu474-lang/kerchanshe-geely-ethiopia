import apiClient from '@/lib/apiClient';

export const newsAdminService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/news${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/news/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/admin/news', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/admin/news/${id}`, payload);
    return data;
  },
  publish: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/news/${id}/publish`);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/news/${id}`);
  },
};
