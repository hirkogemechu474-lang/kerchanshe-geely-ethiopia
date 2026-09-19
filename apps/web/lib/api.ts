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
  featured?: boolean;
  rating?: number;
  facilities?: {
    showroom?: boolean;
    serviceCenter?: boolean;
    partsShop?: boolean;
    testDriveArea?: boolean;
    customerLounge?: boolean;
    parking?: boolean;
  };
}

// The Prisma Dealer model (backend/prisma/schema.prisma) nests contact info
// under `contact: {phone, email, whatsapp}` and hours under
// `workingHours: {weekdays, saturday, sunday}`, with flat `latitude`/
// `longitude` columns — this normalizer maps the raw API row onto the flat
// `phone`/`email`/`hours`/`coordinates` shape the dealer pages read.
function normalizeDealer(raw: any): Dealer {
  return {
    ...raw,
    phone: raw?.contact?.phone ?? raw?.phone,
    email: raw?.contact?.email ?? raw?.email,
    hours: raw?.workingHours
      ? { weekday: raw.workingHours.weekdays, saturday: raw.workingHours.saturday, sunday: raw.workingHours.sunday }
      : raw?.hours,
    coordinates:
      raw?.latitude != null && raw?.longitude != null
        ? { latitude: raw.latitude, longitude: raw.longitude }
        : raw?.coordinates,
  };
}

export async function getDealers(): Promise<Dealer[]> {
  // /dealers (no /public prefix) requires an admin session and 401s for
  // site visitors — the public, unauthenticated listing lives at
  // /public/dealers (backend/src/routes/public.routes.ts).
  const { data } = await apiClient.get('/public/dealers');
  const list = Array.isArray(data) ? data : data.dealers || [];
  return list.map(normalizeDealer);
}

export async function getDealerById(id: string): Promise<Dealer> {
  const { data } = await apiClient.get(`/public/dealers/${id}`);
  return normalizeDealer(data);
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
