/**
 * Vehicle Service — thin wrapper around the lib/vehicleData fetchers.
 * Import server-side data functions from here: @/services/vehicleService
 */
export {
  getVehicles,
  getVehicleBySlug,
  getVehicleById,
  getVehiclesByType,
  getVehicleBrands,
  getVehicleCategories,
  formatVehiclePrice,
  getAvailabilityBadge,
  vehicles,
} from '@/lib/vehicleData';

export type {
  VehicleRecord,
  VehicleBrand,
  VehicleCategory,
  VehicleListResponse,
  VehicleStatus,
} from '@/lib/vehicleData';
