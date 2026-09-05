import apiClient from '@/lib/apiClient';

export const quoteService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/quotations${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/quotations/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/admin/quotations/${id}/status`, { status });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/quotations/${id}`);
  },
};
