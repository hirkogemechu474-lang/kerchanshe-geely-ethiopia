import { dealerRepository } from '@/repositories/dealerRepository';

// Preserved as-is (pre-existing, unreferenced by any frontend code — see
// dealerRepository.findManyLegacy/createLegacy for why this stays broken
// rather than being silently "fixed" during a mechanical reorg).
export async function listDealersLegacy(city: string) {
  const where: any = { isActive: true };
  if (city && city !== 'all') {
    where.city = city;
  }

  const dealers = await dealerRepository.findManyLegacy(where);

  return dealers.map((dealer: any) => ({
    ...dealer,
    services: JSON.parse(dealer.services as string),
    hours: JSON.parse(dealer.hours as string),
  }));
}

export async function createDealerLegacy(data: any) {
  return dealerRepository.createLegacy({
    name: data.name,
    city: data.city,
    address: data.address,
    phone: data.phone,
    email: data.email,
    services: JSON.stringify(data.services || []),
    hours: JSON.stringify(data.hours || {}),
    salesCount: 0,
    staffCount: parseInt(data.staffCount || 0),
    rating: 0,
    isActive: true,
  });
}
