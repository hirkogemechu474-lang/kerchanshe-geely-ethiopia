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

export function getAvailabilityBadge(availability: string): { label: string; color: string } {
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

export async function getParts(params?: Record<string, string>): Promise<Part[]> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const { data } = await apiClient.get(`/parts${query}`);
  return Array.isArray(data) ? data : data.parts || [];
}

export async function getPartBySlug(slug: string): Promise<Part> {
  const { data } = await apiClient.get(`/parts/${slug}`);
  return data;
}

export async function getPartCategories(): Promise<string[]> {
  const { data } = await apiClient.get('/parts/categories');
  return Array.isArray(data) ? data : data.categories || [];
}

export const parts = {
  list: getParts,
  getBySlug: getPartBySlug,
  getCategories: getPartCategories,
};
