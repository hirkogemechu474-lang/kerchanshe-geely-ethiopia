/**
 * API Client for Geely Ethiopia CMS
 * Fetches data from the local CMS API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_CMS_API_URL || '/api/public';

/**
 * Generic fetch function with error handling
 */
async function fetchAPI<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Business Settings
 */
export interface BusinessSettings {
  companyName: string;
  companyLegalName: string;
  tagline: string;
  description: string;
  established: string;
  vatNumber: string;
  tinNumber: string;
  tradeLicenseNumber: string;
  businessHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
    holidays: string;
  };
  currency: string;
  language: string;
  timezone: string;
  country: string;
  region: string;
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  return fetchAPI<BusinessSettings>('/business-settings');
}

/**
 * Contact Information
 */
export interface ContactInformation {
  headquarters: {
    name: string;
    address: {
      street: string;
      area: string;
      city: string;
      region: string;
      country: string;
      postalCode: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  phone: {
    primary: string;
    sales: string;
    service: string;
    parts: string;
    emergency: string;
  };
  email: {
    general: string;
    sales: string;
    service: string;
    support: string;
    careers: string;
  };
  whatsapp: string;
  website: string;
}

export async function getContactInformation(): Promise<ContactInformation> {
  return fetchAPI<ContactInformation>('/contact-information');
}

/**
 * Social Media
 */
export interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  handle: string;
  active: boolean;
  followers: string;
}

export async function getSocialMedia(): Promise<SocialMedia[]> {
  return fetchAPI<SocialMedia[]>('/social-media');
}

/**
 * Banking Partners
 */
export interface BankingPartner {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  type: string;
  active: boolean;
  financing: {
    autoLoans: boolean;
    minDownPayment: number;
    maxTenure: number;
    interestRate: {
      min: number;
      max: number;
    };
    processingFee: number;
    eligibility: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
    branches: string;
  };
  features: string[];
}

export async function getBankingPartners(): Promise<BankingPartner[]> {
  return fetchAPI<BankingPartner[]>('/banking-partners');
}

/**
 * Dealers
 */
export interface Dealer {
  id: string;
  name: string;
  type: string;
  description?: string;
  website?: string;
  logo?: string;
  gallery?: string[];
  city: string;
  region: string;
  country?: string;
  address: {
    street: string;
    area: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
  };
  phone: string;
  email: string;
  services: string[];
  hours?: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  workingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  facilities: {
    showroom: boolean;
    serviceCenter: boolean;
    partsShop: boolean;
    testDriveArea: boolean;
    customerLounge: boolean;
    parking: string;
  };
  active: boolean;
  featured: boolean;
}

export async function getDealers(): Promise<Dealer[]> {
  return fetchAPI<Dealer[]>('/dealers');
}

export async function getDealerById(id: string): Promise<Dealer | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/dealers/${id}`, {
      next: { revalidate: 60 },
    });

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch dealer ${id}:`, error);
    throw error;
  }
}

/**
 * Vehicle Settings
 */
export interface VehicleSettings {
  categories: Array<{
    id: string;
    name: string;
    description: string;
    displayOrder: number;
    active: boolean;
  }>;
  features: {
    safety: string[];
    comfort: string[];
    technology: string[];
    performance: string[];
  };
  specifications: {
    engine: string[];
    transmission: string[];
    fuelType: string[];
    driveType: string[];
  };
  warranty: {
    vehicle: string;
    battery: string;
    paintwork: string;
    corrosion: string;
  };
  serviceIntervals: {
    standard: string;
    electric: string;
  };
}

export async function getVehicleSettings(): Promise<VehicleSettings> {
  return fetchAPI<VehicleSettings>('/vehicle-settings');
}

/**
 * Financing Settings
 */
export interface FinancingSettings {
  enabled: boolean;
  calculator: {
    enabled: boolean;
    defaultDownPayment: number;
    minDownPayment: number;
    maxDownPayment: number;
    defaultTenure: number;
    minTenure: number;
    maxTenure: number;
    tenureOptions: number[];
    defaultInterestRate: number;
    interestRateRange: {
      min: number;
      max: number;
    };
  };
  requirements: {
    ethiopianCitizenship: boolean;
    minAge: number;
    maxAge: number;
    minMonthlyIncome: number;
    employmentRequired: boolean;
    minEmploymentYears: number;
    documents: string[];
  };
  process: {
    steps: Array<{
      step: number;
      title: string;
      description: string;
      duration: string;
    }>;
    totalDuration: string;
    fastTrackAvailable: boolean;
    fastTrackDuration: string;
  };
  fees: {
    processingFee: {
      percentage: number;
      min: number;
      max: number;
    };
    insurance: {
      comprehensive: {
        percentage: number;
        description: string;
      };
      thirdParty: {
        fixed: number;
        description: string;
      };
    };
    registration: {
      plates: number;
      license: number;
      inspection: number;
    };
  };
  additionalInfo: {
    latePaymentPenalty: number;
    earlyRepaymentAllowed: boolean;
    earlyRepaymentPenalty: number;
    gracePeriod: number;
    maxMissedPayments: number;
    balloonPaymentAvailable: boolean;
  };
  support: {
    phone: string;
    email: string;
    whatsapp: string;
    consultationAvailable: boolean;
    consultationFree: boolean;
  };
}

export async function getFinancingSettings(): Promise<FinancingSettings> {
  return fetchAPI<FinancingSettings>('/financing-settings');
}
