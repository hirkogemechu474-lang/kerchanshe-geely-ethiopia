import apiClient from '@/lib/apiClient';

export interface CreateVehiclePayload {
  name: string;
  slug: string;
  model: string;
  year: number;
  categoryId: string;
  basePrice: number;
  description?: string;
  isFeatured?: boolean;
}

export interface UpdateVehiclePayload extends Partial<CreateVehiclePayload> {
  isActive?: boolean;
  status?: string;
  displayOrder?: number;
}

export const vehicleAdminService = {
  list: async (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const { data } = await apiClient.get(`/admin/vehicles${q}`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/admin/vehicles/${id}`);
    return data;
  },
  create: async (data: CreateVehiclePayload) => {
    const response = await apiClient.post('/admin/vehicles', data);
    return response.data;
  },
  update: async (id: string, data: UpdateVehiclePayload) => {
    const response = await apiClient.patch(`/admin/vehicles/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/vehicles/${id}`);
  },
};
