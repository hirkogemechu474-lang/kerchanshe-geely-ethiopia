import type { Dealer } from '@prisma/client';

// Shared public-facing shape for /api/public/dealers and /api/public/dealers/[id] —
// both routes duplicated this transform verbatim before this extraction.
export function toPublicDealer(dealer: Dealer) {
  return {
    id: dealer.id,
    name: dealer.name,
    type: dealer.type,
    description: dealer.description,
    website: dealer.website,
    logo: dealer.logo,
    gallery: dealer.gallery as string[],
    active: dealer.active,
    featured: dealer.featured,
    city: dealer.city,
    region: dealer.region,
    country: dealer.country,
    address: dealer.address as {
      street: string;
      area: string;
      city: string;
      region: string;
      country: string;
      postalCode: string;
    },
    coordinates: {
      lat: dealer.latitude,
      lng: dealer.longitude,
      latitude: dealer.latitude,
      longitude: dealer.longitude,
    },
    contact: dealer.contact as {
      phone: string;
      email: string;
      whatsapp: string;
    },
    phone: (dealer.contact as any)?.phone || '',
    email: (dealer.contact as any)?.email || '',
    services: dealer.services as string[],
    hours: dealer.workingHours as {
      weekday: string;
      saturday: string;
      sunday: string;
    },
    workingHours: dealer.workingHours as {
      weekdays: string;
      saturday: string;
      sunday: string;
    },
    facilities: dealer.facilities as {
      showroom: boolean;
      serviceCenter: boolean;
      partsShop: boolean;
      testDriveArea: boolean;
      customerLounge: boolean;
      parking: string;
    },
  };
}
