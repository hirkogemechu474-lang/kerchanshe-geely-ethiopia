import apiClient from '@/lib/apiClient';

export const testDriveService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/test-drives${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/test-drives/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/admin/test-drives/${id}/status`, { status });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/test-drives/${id}`);
  },
};
