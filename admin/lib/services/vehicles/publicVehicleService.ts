import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET /api/public/vehicles — for the web frontend.
export async function listPublicVehicles(filters: { category?: string | null; brand?: string | null; limit?: number }) {
  const where: any = { isActive: true };
  if (filters.category) where.vehicleCategory = { slug: filters.category };
  if (filters.brand) where.brand = { slug: filters.brand };

  return vehicleRepository.findManyPublic(where, filters.limit);
}

export async function getPublicVehicleBySlug(slug: string) {
  return vehicleRepository.findPublicBySlug(slug);
}
