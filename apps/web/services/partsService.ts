import apiClient from '@/lib/apiClient';

export interface Part {
  id: string;
  name: string;
  slug?: string;
  partNumber?: string;
  price: number;
  category?: string;
  vehicle?: string;
  availability?: string;
  image?: string;
  description?: string;
}

export async function searchParts(query: string): Promise<Part[]> {
  const { data } = await apiClient.get(`/parts?search=${encodeURIComponent(query)}`);
  return Array.isArray(data) ? data : data.parts || [];
}

export async function getPartsByCategory(category: string): Promise<Part[]> {
  const { data } = await apiClient.get(`/parts?category=${category}`);
  return Array.isArray(data) ? data : data.parts || [];
}

export async function getPartsByVehicle(vehicle: string): Promise<Part[]> {
  const { data } = await apiClient.get(`/parts?vehicle=${vehicle}`);
  return Array.isArray(data) ? data : data.parts || [];
}

export async function getPartsByAvailability(availability: string): Promise<Part[]> {
  const { data } = await apiClient.get(`/parts?availability=${availability}`);
  return Array.isArray(data) ? data : data.parts || [];
}

export function getPartAvailabilityBadge(availability: string): { label: string; color: string } {
  switch (availability?.toLowerCase()) {
    case 'in_stock':
    case 'available':
      return { label: 'In Stock', color: 'green' };
    case 'low_stock':
      return { label: 'Low Stock', color: 'yellow' };
    case 'out_of_stock':
    case 'unavailable':
      return { label: 'Out of Stock', color: 'red' };
    default:
      return { label: availability || 'Unknown', color: 'gray' };
  }
}

export const parts = {
  search: searchParts,
  getByCategory: getPartsByCategory,
  getByVehicle: getPartsByVehicle,
  getByAvailability: getPartsByAvailability,
};
