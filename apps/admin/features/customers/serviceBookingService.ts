import apiClient from '@/lib/apiClient';

export const serviceBookingService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/service-bookings${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/service-bookings/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/admin/service-bookings/${id}/status`, { status });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/service-bookings/${id}`);
  },
};
