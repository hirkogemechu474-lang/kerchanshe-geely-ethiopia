import { dealerRepository } from '@/repositories/dealerRepository';

// GET /api/public/dealers — for the web frontend.
export async function listPublicDealers(filters: { city?: string | null; region?: string | null }) {
  return dealerRepository.findManyPublic(filters.city, filters.region);
}
