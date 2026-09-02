import { prisma } from '../config/database';

export const rolePermissionRepository = {
  async findMany() {
    return prisma.rolePermissionOverride.findMany({
      orderBy: [{ role: 'asc' }, { permissionKey: 'asc' }],
    });
  },

  async upsert(role: string, permissionKey: string, value: boolean, updatedById?: string) {
    return prisma.rolePermissionOverride.upsert({
      where: { role_permissionKey: { role, permissionKey } },
      create: { role, permissionKey, value, updatedById },
      update: { value, updatedById },
    });
  },

  async deleteMany(role: string, permissionKey?: string) {
    return prisma.rolePermissionOverride.deleteMany({
      where: {
        role,
        ...(permissionKey && { permissionKey }),
      },
    });
  },
};
