import apiClient from '@/lib/apiClient';

export const userAdminService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/users${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/admin/users', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/admin/users/${id}`, payload);
    return data;
  },
  updateRole: async (id: string, role: string) => {
    const { data } = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return data;
  },
  toggleStatus: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/users/${id}/status`);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/users/${id}`);
  },
};
