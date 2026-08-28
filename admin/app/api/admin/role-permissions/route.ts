import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { ADMIN_ROLES, type AdminPermissions } from '@/lib/auth/types';
import { PERMISSION_GROUPS } from '@/lib/auth/permissionGroups';
import { getEffectivePermissionsForAdminRoles, invalidateRolePermissionsCache, LOCKED_ROLE } from '@/lib/auth/rolePermissions';
import { rolePermissionRepository } from '@/repositories/rolePermissionRepository';

const EDITABLE_KEYS = new Set(PERMISSION_GROUPS.flatMap((g) => g.keys.map((k) => k.key)));

// GET - the full Roles & Permissions matrix: effective (default + override
// merged) permissions per role, plus which cells are actual overrides so the
// UI can show a "customized" indicator and offer a per-cell reset.
export async function GET() {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;
  if (!session!.user.permissions.canManageUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { effective, overrides } = await getEffectivePermissionsForAdminRoles();

  return NextResponse.json({
    roles: ADMIN_ROLES,
    lockedRole: LOCKED_ROLE,
    permissionGroups: PERMISSION_GROUPS,
    effective,
    overrides,
  });
}

// PATCH - toggle a single (role, permissionKey) cell. Body: { role, permissionKey, value }.
export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;
  if (!session!.user.permissions.canManageUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { role, permissionKey, value } = body as { role?: string; permissionKey?: string; value?: boolean };

  if (!role || !permissionKey || typeof value !== 'boolean') {
    return NextResponse.json({ error: 'role, permissionKey, and a boolean value are required' }, { status: 400 });
  }
  if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
  }
  if (role === LOCKED_ROLE) {
    return NextResponse.json({ error: 'super_admin permissions cannot be overridden — this role must always keep full access.' }, { status: 400 });
  }
  if (!EDITABLE_KEYS.has(permissionKey as keyof AdminPermissions)) {
    return NextResponse.json({ error: 'Unknown or non-editable permission key' }, { status: 400 });
  }

  await rolePermissionRepository.upsertOverride(role, permissionKey, value, session!.user.id);
  invalidateRolePermissionsCache();

  const { effective } = await getEffectivePermissionsForAdminRoles();
  return NextResponse.json({ effective: effective[role] });
}

// DELETE - reset one cell (?role=&permissionKey=) or every override for a
// role (?role= only) back to the hardcoded default.
export async function DELETE(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;
  if (!session!.user.permissions.canManageUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const permissionKey = searchParams.get('permissionKey');

  if (!role || !ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({ error: 'A valid role is required' }, { status: 400 });
  }

  if (permissionKey) {
    await rolePermissionRepository.deleteOverride(role, permissionKey);
  } else {
    await rolePermissionRepository.deleteAllOverridesForRole(role);
  }
  invalidateRolePermissionsCache();

  const { effective } = await getEffectivePermissionsForAdminRoles();
  return NextResponse.json({ effective: effective[role] });
}
