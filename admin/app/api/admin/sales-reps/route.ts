import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Narrow-purpose listing of active sales-role users, for the sales-agent
// assignment dropdown in OrderCommissionPanel — gated by canManageQuotations
// (same as the rest of the order-management surface) rather than
// canViewUsers/canManageUsers, since a Sales Rep/Manager doing this
// assignment doesn't have general user-management access.
const ASSIGNABLE_ROLES = ['sales', 'sales_representative', 'sales_manager'];

export async function GET() {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const reps = await prisma.user.findMany({
    where: { role: { in: ASSIGNABLE_ROLES }, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return NextResponse.json({ reps });
}
