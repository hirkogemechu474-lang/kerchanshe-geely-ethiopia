import { sparePartRepository } from '@/repositories/sparePartRepository';

// Powers the "Spare Parts" sidebar badge (AdminLayout) — parts.stock is only
// ever checked when someone happens to open the Parts page; this makes the
// same count visible from anywhere in the admin instead of on-view-only.
export async function countLowStockParts() {
  const parts = await sparePartRepository.findActiveStockLevels();
  return parts.filter((p) => p.stock < p.reorderPoint).length;
}
