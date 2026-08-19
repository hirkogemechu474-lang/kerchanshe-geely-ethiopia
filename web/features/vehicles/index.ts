/**
 * Vehicles feature barrel.
 * Components that are tightly scoped to the vehicles feature live here.
 * Shared/layout components remain in /components.
 */
export { vehicleRepository } from '@/repositories/vehicleRepository';
export { VehicleModel }       from '@/models/VehicleModel';
export { useVehicles }         from '@/hooks/useVehicles';
export * from '@/types/vehicle';
