/**
 * RolePermissionRepository — server-only Prisma queries for role
 * permission overrides. The default/effective permission computation
 * itself lives in lib/auth/rolePermissions.ts (cross-cutting auth infra,
 * out of scope for this reorg) — this repository only owns the raw
 * override rows.
 */
import { prisma } from '@/lib/prisma';

export const rolePermissionRepository = {
  async upsertOverride(role: string, permissionKey: string, value: boolean, updatedById: string) {
    return prisma.rolePermissionOverride.upsert({
      where: { role_permissionKey: { role, permissionKey } },
      create: { role, permissionKey, value, updatedById },
      update: { value, updatedById },
    });
  },

  async deleteOverride(role: string, permissionKey: string) {
    return prisma.rolePermissionOverride.deleteMany({ where: { role, permissionKey } });
  },

  async deleteAllOverridesForRole(role: string) {
    return prisma.rolePermissionOverride.deleteMany({ where: { role } });
  },
};
