import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { userRepository } from '@/repositories/userRepository';

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

  const reps = await userRepository.findManyByRoles(ASSIGNABLE_ROLES);

  return NextResponse.json({ reps });
}
