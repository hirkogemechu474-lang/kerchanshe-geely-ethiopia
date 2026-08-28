import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { countLowStockParts } from '@/lib/services/parts/sparePartStockService';

// Powers the "Spare Parts" sidebar badge (AdminLayout) — parts.stock is only
// ever checked when someone happens to open the Parts page (see the
// lowStockParts count in app/admin/parts/page.tsx); this makes the same
// count visible from anywhere in the admin instead of on-view-only.
export async function GET() {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageSpareParts) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const count = await countLowStockParts();

  return NextResponse.json({ count });
}
