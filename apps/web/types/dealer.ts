export interface Dealer {
  id: string;
  name: string;
  slug?: string;
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
  workingHours?: string;
  hours?: Record<string, string>;
  contact?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  services?: string[];
  images?: string[];
  gallery?: string[];
  logo?: string;
  description?: string;
  type?: string;
  isActive?: boolean;
}
