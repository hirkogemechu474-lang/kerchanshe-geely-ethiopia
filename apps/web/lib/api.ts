import apiClient from '@/lib/apiClient';

export interface Dealer {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  gallery?: string[];
  address?: {
    street?: string;
    area?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  city?: string;
  region?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  location?: {
    lat?: number;
    lng?: number;
  };
  latitude?: number;
  longitude?: number;
  workingHours?: string;
  hours?: Record<string, string>;
  contact?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  services?: string[];
  images?: string[];
  type?: string;
  isActive?: boolean;
}

export async function getDealers(): Promise<Dealer[]> {
  const { data } = await apiClient.get('/dealers');
  return Array.isArray(data) ? data : data.dealers || [];
}

export async function getDealerById(id: string): Promise<Dealer> {
  const { data } = await apiClient.get(`/dealers/${id}`);
  return data;
}

export async function getBusinessSettings(): Promise<any> {
  const { data } = await apiClient.get('/settings/business');
  return data;
}

export async function getContactInformation(): Promise<any> {
  const { data } = await apiClient.get('/settings/contact');
  return data;
}

export async function getSocialMedia(): Promise<any> {
  const { data } = await apiClient.get('/settings/social');
  return data;
}

export async function getBankingPartners(): Promise<any[]> {
  const { data } = await apiClient.get('/financing/banks');
  return Array.isArray(data) ? data : data.banks || [];
}

export async function getVehicleSettings(): Promise<any> {
  const { data } = await apiClient.get('/settings/vehicle');
  return data;
}

export async function getFinancingSettings(): Promise<any> {
  const { data } = await apiClient.get('/settings/financing');
  return data;
}

export interface BusinessSettings {
  id?: string;
  companyName?: string;
  tagline?: string;
  description?: string;
  logo?: string;
}

export interface ContactInformation {
  id?: string;
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
}

export interface SocialMedia {
  id?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  telegram?: string;
}

export interface BankingPartner {
  id: string;
  name: string;
  logo?: string;
}

export interface VehicleSettings {
  id?: string;
  brands?: string[];
  categories?: string[];
}

export interface FinancingSettings {
  id?: string;
  enabled?: boolean;
  partners?: BankingPartner[];
}
