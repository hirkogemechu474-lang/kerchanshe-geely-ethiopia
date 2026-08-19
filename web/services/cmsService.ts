/**
 * CMS Service — wraps the Strapi API client and the local public API client.
 * Import from: @/services/cmsService
 */

// Strapi-backed API (lib/strapi.ts)
export {
  strapiAPI,
  vehicleAPI,
  newsAPI,
  testimonialsAPI,
  dealersAPI,
  promotionsAPI,
  partsAPI,
  leadsAPI,
  checkStrapiConnection,
} from '@/lib/strapi';

// Local public API helpers (lib/api.ts)
export {
  getBusinessSettings,
  getContactInformation,
  getSocialMedia,
  getBankingPartners,
  getDealers,
  getDealerById,
  getVehicleSettings,
  getFinancingSettings,
} from '@/lib/api';

export type {
  BusinessSettings,
  ContactInformation,
  SocialMedia,
  BankingPartner,
  VehicleSettings,
  FinancingSettings,
} from '@/lib/api';
