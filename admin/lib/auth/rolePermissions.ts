import { prisma } from '@/lib/prisma';
import { AdminRole, ROLE_PERMISSIONS, ADMIN_ROLES, type AdminPermissions } from './types';

// super_admin is never overridable — always the full hardcoded defaults —
// so there's always one role guaranteed to be able to undo a permissions
// mistake, even if every other role gets misconfigured.
export const LOCKED_ROLE = AdminRole.SUPER_ADMIN;

const CACHE_TTL_MS = 30_000;
let cache: { byRole: Record<string, Partial<AdminPermissions>>; expiresAt: number } | null = null;

async function loadOverrides(): Promise<Record<string, Partial<AdminPermissions>>> {
  const rows = await prisma.rolePermissionOverride.findMany();
  const byRole: Record<string, Partial<AdminPermissions>> = {};
  for (const row of rows) {
    if (!byRole[row.role]) byRole[row.role] = {};
    (byRole[row.role] as Record<string, boolean>)[row.permissionKey] = row.value;
  }
  return byRole;
}

async function getOverridesByRole(): Promise<Record<string, Partial<AdminPermissions>>> {
  if (cache && cache.expiresAt > Date.now()) return cache.byRole;
  const byRole = await loadOverrides();
  cache = { byRole, expiresAt: Date.now() + CACHE_TTL_MS };
  return byRole;
}

/** Call after writing an override so the change is visible on the very next
 * request instead of waiting out the cache TTL. */
export function invalidateRolePermissionsCache() {
  cache = null;
}

/** The permissions a session should actually get for `role` right now —
 * hardcoded defaults with any admin-applied overrides merged on top. This is
 * the only function that should feed a live session (see
 * admin/lib/auth/config.ts's `session` callback); reading ROLE_PERMISSIONS
 * directly anywhere else in a request path would silently ignore overrides. */
export async function getEffectivePermissions(role: AdminRole): Promise<AdminPermissions> {
  const defaults = ROLE_PERMISSIONS[role];
  if (!defaults) return ROLE_PERMISSIONS[AdminRole.CUSTOMER];
  if (role === LOCKED_ROLE) return defaults;
  const overrides = await getOverridesByRole();
  const roleOverrides = overrides[role];
  return roleOverrides ? { ...defaults, ...roleOverrides } : defaults;
}

/** Effective permissions for every staff role at once, for the Roles &
 * Permissions matrix — one query instead of one per role. */
export async function getEffectivePermissionsForAdminRoles(): Promise<{
  effective: Record<string, AdminPermissions>;
  overrides: Record<string, Partial<AdminPermissions>>;
}> {
  const overrides = await getOverridesByRole();
  const effective: Record<string, AdminPermissions> = {};
  for (const role of ADMIN_ROLES) {
    const defaults = ROLE_PERMISSIONS[role];
    effective[role] = role === LOCKED_ROLE ? defaults : { ...defaults, ...(overrides[role] ?? {}) };
  }
  return { effective, overrides };
}
