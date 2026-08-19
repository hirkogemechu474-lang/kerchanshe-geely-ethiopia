/**
 * Parts Service — wraps lib/partsData static data.
 * Import from: @/services/partsService
 */
export {
  parts,
  partCategories,
  getPartsByCategory,
  getPartsByVehicle,
  getPartsByAvailability,
  searchParts,
  getAvailabilityBadge as getPartAvailabilityBadge,
} from '@/lib/partsData';

export type { Part } from '@/lib/partsData';
