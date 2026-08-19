const API_BASE_URL = process.env.NEXT_PUBLIC_CMS_API_URL || '/api/public';

export type VehicleStatus = 'draft' | 'published' | 'archived';

export interface VehicleBrand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brandId?: string | null;
  brand?: VehicleBrand | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface VehicleRecord {
  id: string;
  name: string;
  slug: string;
  model: string;
  year: number;
  category: string;
  brandId?: string | null;
  brand?: VehicleBrand | null;
  categoryId?: string | null;
  vehicleCategory?: VehicleCategory | null;
  description?: string | null;
  images?: unknown;
  specifications?: unknown;
  basePrice: number;
  discountAmount?: number | null;
  discountType?: string | null;
  badge?: string | null;
  taxRate?: number;
  finalPrice?: number | null;
  hidePrice?: boolean;
  stock?: number;
  sku?: string | null;
  reorderPoint?: number | null;
  warehouse?: string | null;
  location?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  status?: VehicleStatus | string;
  displayOrder?: number;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
}

export interface VehicleListResponse {
  vehicles: VehicleRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function fetchJSON<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    next: init?.method ? undefined : { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export function formatVehiclePrice(price: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(price);
}

export async function getVehicleBrands(): Promise<VehicleBrand[]> {
  return fetchJSON<VehicleBrand[]>('/brands');
}

export async function getVehicleCategories(brand?: string): Promise<VehicleCategory[]> {
  const query = brand ? `?brand=${encodeURIComponent(brand)}` : '';
  return fetchJSON<VehicleCategory[]>(`/categories${query}`);
}

export async function getVehicles(params?: {
  category?: string;
  brand?: string;
  featured?: boolean;
  includeInactive?: boolean;
}): Promise<VehicleRecord[]> {
  const searchParams = new URLSearchParams();

  if (params?.category) searchParams.set('category', params.category);
  if (params?.brand) searchParams.set('brand', params.brand);
  if (params?.featured) searchParams.set('featured', 'true');
  if (params?.includeInactive) searchParams.set('includeInactive', 'true');

  const query = searchParams.toString();
  const response = await fetchJSON<VehicleRecord[]>(
    `/vehicles${query ? `?${query}` : ''}`
  );
  return Array.isArray(response) ? response : [];
}

export async function getVehicleBySlug(slug: string): Promise<VehicleRecord | null> {
  try {
    return await fetchJSON<VehicleRecord>(`/vehicles/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function getVehicleById(id: string): Promise<VehicleRecord | undefined> {
  const vehicle = await getVehicleBySlug(id);
  return vehicle || undefined;
}

export async function getVehiclesByType(type: string): Promise<VehicleRecord[]> {
  return getVehicles({ category: type });
}

export const vehicles = getVehicles;

export function getAvailabilityBadge(status: string) {
  const normalized = status?.toLowerCase();

  const badges: Record<string, { label: string; color: string }> = {
    available: { label: 'In Stock', color: 'bg-green-500' },
    'coming-soon': { label: 'Coming Soon', color: 'bg-yellow-500' },
    'pre-order': { label: 'Pre-Order', color: 'bg-blue-500' },
    limited: { label: 'Limited Stock', color: 'bg-orange-500' },
    'out-of-stock': { label: 'Out of Stock', color: 'bg-red-500' },
    active: { label: 'Available', color: 'bg-green-500' },
    featured: { label: 'Featured', color: 'bg-gold' },
    new: { label: 'New', color: 'bg-blue-500' },
    popular: { label: 'Popular', color: 'bg-orange-500' },
    electric: { label: 'Electric', color: 'bg-emerald-500' },
  };

  return badges[normalized] || { label: 'Available', color: 'bg-green-500' };
}
