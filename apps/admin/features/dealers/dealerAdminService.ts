import apiClient from '@/lib/apiClient';

export const dealerAdminService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/dealers${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/dealers/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/admin/dealers', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/admin/dealers/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/dealers/${id}`);
  },
};
