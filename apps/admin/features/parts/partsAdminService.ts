import apiClient from '@/lib/apiClient';

export const partsAdminService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/parts${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/parts/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/admin/parts', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/admin/parts/${id}`, payload);
    return data;
  },
  updateStock: async (id: string, stock: number) => {
    const { data } = await apiClient.patch(`/admin/parts/${id}/stock`, { stock });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/parts/${id}`);
  },
};
