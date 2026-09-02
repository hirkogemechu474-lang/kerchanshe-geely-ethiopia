import apiClient from '@/lib/apiClient';

export interface Promotion {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  image?: string;
  discount?: number;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  type?: string;
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const { data } = await apiClient.get('/promotions?active=true');
  return Array.isArray(data) ? data : data.promotions || [];
}

export async function getFeaturedPromotions(): Promise<Promotion[]> {
  const { data } = await apiClient.get('/promotions?featured=true');
  return Array.isArray(data) ? data : data.promotions || [];
}

export async function getPromotionsByVehicle(vehicleId: string): Promise<Promotion[]> {
  const { data } = await apiClient.get(`/promotions?vehicleId=${vehicleId}`);
  return Array.isArray(data) ? data : data.promotions || [];
}

export async function getPromotionsByType(type: string): Promise<Promotion[]> {
  const { data } = await apiClient.get(`/promotions?type=${type}`);
  return Array.isArray(data) ? data : data.promotions || [];
}

export const promotions = {
  getActive: getActivePromotions,
  getFeatured: getFeaturedPromotions,
  getByVehicle: getPromotionsByVehicle,
  getByType: getPromotionsByType,
};
