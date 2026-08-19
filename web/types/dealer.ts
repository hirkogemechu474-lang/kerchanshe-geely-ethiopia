/**
 * Dealer types for the public website.
 */

export interface DealerAddress {
  street: string;
  area: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
}

export interface DealerCoordinates {
  latitude: number;
  longitude: number;
}

export interface DealerContact {
  phone: string;
  email: string;
  whatsapp: string;
}

export interface DealerHours {
  weekdays: string;
  saturday: string;
  sunday: string;
}

export interface DealerFacilities {
  showroom: boolean;
  serviceCenter: boolean;
  partsShop: boolean;
  testDriveArea: boolean;
  customerLounge: boolean;
  parking: string;
}

export interface Dealer {
  id: string;
  name: string;
  type: string;
  description?: string;
  website?: string;
  logo?: string;
  image?: string;
  gallery?: string[];
  city: string;
  region: string;
  country?: string;
  address: string | DealerAddress;
  coordinates?: DealerCoordinates;
  /** Legacy flat coordinate shape */
  location?: { lat: number; lng: number };
  contact?: DealerContact;
  phone: string;
  email: string;
  services: string[];
  hours?: DealerHours | string;
  workingHours?: DealerHours;
  facilities?: DealerFacilities;
  active: boolean;
  featured?: boolean;
}
