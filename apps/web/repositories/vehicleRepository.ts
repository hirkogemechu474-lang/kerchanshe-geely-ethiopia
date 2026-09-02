import apiClient from '@/lib/apiClient';

export const vehicleRepository = {
  async findAll(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/vehicles${query}`);
    return Array.isArray(data) ? data : data.vehicles || [];
  },
  async findById(id: string) {
    const { data } = await apiClient.get(`/vehicles/${id}`);
    return data;
  },
  async findBySlug(slug: string) {
    const { data } = await apiClient.get(`/vehicles/${slug}`);
    return data;
  },
};
