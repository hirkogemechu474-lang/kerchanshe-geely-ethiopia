import apiClient from '@/lib/apiClient';

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
  tiktok?: string;
  linkedin?: string;
}

export interface BankingPartner {
  id: string;
  name: string;
  logo?: string;
  programs?: string[];
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

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { data } = await apiClient.get('/settings/business');
  return data;
}

export async function getContactInformation(): Promise<ContactInformation> {
  const { data } = await apiClient.get('/settings/contact');
  return data;
}

export async function getSocialMedia(): Promise<SocialMedia> {
  const { data } = await apiClient.get('/settings/social');
  return data;
}

export async function getBankingPartners(): Promise<BankingPartner[]> {
  const { data } = await apiClient.get('/financing/banks');
  return Array.isArray(data) ? data : data.banks || [];
}

export async function getDealers(): Promise<any[]> {
  const { data } = await apiClient.get('/dealers');
  return Array.isArray(data) ? data : data.dealers || [];
}

export async function getDealerById(id: string): Promise<any> {
  const { data } = await apiClient.get(`/dealers/${id}`);
  return data;
}

export async function getVehicleSettings(): Promise<VehicleSettings> {
  const { data } = await apiClient.get('/settings/vehicle');
  return data;
}

export async function getFinancingSettings(): Promise<FinancingSettings> {
  const { data } = await apiClient.get('/settings/financing');
  return data;
}

export const strapiAPI = {
  getBusinessSettings,
  getContactInformation,
  getSocialMedia,
};

export const vehicleAPI = {
  list: async () => {
    const { data } = await apiClient.get('/vehicles');
    return data;
  },
};

export const newsAPI = {
  list: async () => {
    const { data } = await apiClient.get('/news');
    return data;
  },
};

export const testimonialsAPI = {
  list: async () => {
    const { data } = await apiClient.get('/testimonials');
    return data;
  },
};

export const dealersAPI = {
  list: getDealers,
  getById: getDealerById,
};

export const promotionsAPI = {
  list: async () => {
    const { data } = await apiClient.get('/promotions');
    return data;
  },
};

export const partsAPI = {
  list: async () => {
    const { data } = await apiClient.get('/parts');
    return data;
  },
};

export const leadsAPI = {
  submit: async (type: string, payload: any) => {
    const { data } = await apiClient.post(`/${type}`, payload);
    return data;
  },
};

export async function checkStrapiConnection(): Promise<boolean> {
  try {
    await apiClient.get('/status');
    return true;
  } catch {
    return false;
  }
}
