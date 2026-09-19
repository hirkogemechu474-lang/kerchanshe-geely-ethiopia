import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/middleware';

// This used to be a second, unrelated "Spare Parts Inventory" page built
// entirely on hardcoded mock data (fake SKUs, a fake "184 SKUs" stat tile) —
// not connected to the real SparePart table at all. It wasn't in the
// sidebar, but WorkshopDashboard.tsx's "Parts Below Reorder" tile (a real,
// live count) linked here, so clicking through from a real number landed on
// fabricated data. Redirects to the real inventory page, same pattern as
// apps/web/app/services/service-booking's redirect to /service.
export default async function SparePartsRedirect() {
  await requirePermission('canManageSpareParts');
  redirect('/admin/parts');
}
