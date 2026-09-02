import apiClient from '@/lib/apiClient';

export const promotionsService = {
  list: async () => {
    const { data } = await apiClient.get('/admin/promotions');
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/promotions/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/admin/promotions', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/admin/promotions/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/promotions/${id}`);
  },
};
