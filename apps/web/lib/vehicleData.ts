import apiClient from '@/lib/apiClient';
import type { VehicleRecord as BaseVehicleRecord, VehicleBrand as BaseVehicleBrand, VehicleCategory as BaseVehicleCategory, VehicleListResponse } from '@/types/vehicle';

export type VehicleRecord = BaseVehicleRecord;
export type VehicleBrand = BaseVehicleBrand;
export type VehicleCategory = BaseVehicleCategory;
export type { VehicleListResponse };
export type VehicleStatus = 'available' | 'limited' | 'sold_out';

export async function getVehicles(params?: Record<string, string>): Promise<VehicleListResponse> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const { data } = await apiClient.get(`/vehicles${query}`);
  return data;
}

export async function getVehicleBySlug(slug: string): Promise<VehicleRecord> {
  const { data } = await apiClient.get(`/vehicles/${slug}`);
  return data;
}

export async function getVehicleById(id: string): Promise<VehicleRecord> {
  const { data } = await apiClient.get(`/vehicles/${id}`);
  return data;
}

export async function getVehiclesByType(type: string): Promise<VehicleRecord[]> {
  const { data } = await apiClient.get(`/vehicles?type=${type}`);
  return data.vehicles || data;
}

export async function getVehicleBrands(): Promise<VehicleBrand[]> {
  const { data } = await apiClient.get('/brands');
  return data;
}

export async function getVehicleCategories(): Promise<VehicleCategory[]> {
  const { data } = await apiClient.get('/categories');
  return data;
}

export function formatVehiclePrice(price: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(price);
}

export function getAvailabilityBadge(status: VehicleStatus): { label: string; color: string } {
  switch (status) {
    case 'available':
      return { label: 'Available', color: 'green' };
    case 'limited':
      return { label: 'Limited Stock', color: 'yellow' };
    case 'sold_out':
      return { label: 'Sold Out', color: 'red' };
    default:
      return { label: 'Unknown', color: 'gray' };
  }
}

export const vehicles = {
  list: getVehicles,
  getBySlug: getVehicleBySlug,
  getById: getVehicleById,
  getByType: getVehiclesByType,
  brands: getVehicleBrands,
  categories: getVehicleCategories,
};
