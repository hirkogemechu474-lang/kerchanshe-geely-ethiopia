import { sparePartRepository } from '@/repositories/sparePartRepository';

// FR-403: parts at or below their reorder level, live-computed on read
// rather than pushed — see docs/SWMS-INTEGRATION-BACKLOG.md for why no
// push/SMS/email channel is wired up for this alert yet.
export async function getReorderAlerts() {
  // Prisma can't compare two columns of the same row in a `where` filter, so
  // this filters in-memory. The parts catalog is small (single-branch scale,
  // NFR-14), so this stays well within the dashboard's <5s budget (§7.2).
  const allParts = await sparePartRepository.findAllActive();
  const parts = allParts
    .filter((p) => p.stock <= p.reorderPoint)
    .sort((a, b) => a.stock - a.reorderPoint - (b.stock - b.reorderPoint));

  return { parts, count: parts.length };
}
