import { dealerRepository } from '@/repositories/dealerRepository';

function parseJson(v: any, fallback: any) {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

export async function createDealer(body: any) {
  return dealerRepository.create({
    name: body.name,
    type: body.type || 'both',
    description: body.description || null,
    city: body.city,
    region: body.region,
    country: body.country || 'Ethiopia',
    address: parseJson(body.address, {}),
    latitude: parseFloat(body.latitude) || 0,
    longitude: parseFloat(body.longitude) || 0,
    contact: parseJson(body.contact, {}),
    website: body.website || null,
    services: parseJson(body.services, []),
    workingHours: parseJson(body.workingHours, {}),
    facilities: parseJson(body.facilities, {}),
    logo: body.logo || null,
    gallery: parseJson(body.gallery, []),
    active: body.active !== false,
    featured: body.featured === true,
    salesCount: parseInt(body.salesCount) || 0,
    staffCount: parseInt(body.staffCount) || 0,
    rating: parseFloat(body.rating) || 0,
  });
}

export type UpdateDealerResult =
  | { ok: true; dealer: any }
  | { ok: false; httpStatus: 404; error: string };

export async function updateDealer(id: string, body: any): Promise<UpdateDealerResult> {
  const existing = await dealerRepository.findById(id);
  if (!existing) {
    return { ok: false, httpStatus: 404, error: 'Dealer not found' };
  }

  const dealer = await dealerRepository.update(id, {
    name: body.name ?? existing.name,
    type: body.type ?? existing.type,
    description: body.description !== undefined ? body.description : existing.description,
    city: body.city ?? existing.city,
    region: body.region ?? existing.region,
    country: body.country ?? existing.country,
    address: body.address !== undefined ? parseJson(body.address, existing.address) : existing.address,
    latitude: body.latitude !== undefined ? parseFloat(body.latitude) || 0 : existing.latitude,
    longitude: body.longitude !== undefined ? parseFloat(body.longitude) || 0 : existing.longitude,
    contact: body.contact !== undefined ? parseJson(body.contact, existing.contact) : existing.contact,
    website: body.website !== undefined ? body.website : existing.website,
    services: body.services !== undefined ? parseJson(body.services, existing.services) : existing.services,
    workingHours: body.workingHours !== undefined ? parseJson(body.workingHours, existing.workingHours) : existing.workingHours,
    facilities: body.facilities !== undefined ? parseJson(body.facilities, existing.facilities) : existing.facilities,
    logo: body.logo !== undefined ? body.logo : existing.logo,
    gallery: body.gallery !== undefined ? parseJson(body.gallery, existing.gallery) : existing.gallery,
    active: body.active !== undefined ? body.active !== false : existing.active,
    featured: body.featured !== undefined ? body.featured === true : existing.featured,
    salesCount: body.salesCount !== undefined ? parseInt(body.salesCount) || 0 : existing.salesCount,
    staffCount: body.staffCount !== undefined ? parseInt(body.staffCount) || 0 : existing.staffCount,
    rating: body.rating !== undefined ? parseFloat(body.rating) || 0 : existing.rating,
  });

  return { ok: true, dealer };
}
