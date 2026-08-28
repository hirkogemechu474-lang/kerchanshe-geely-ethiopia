/**
 * TechnicianRepository — server-only Prisma queries for workshop technicians.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const technicianRepository = {
  async findAll() {
    return prisma.technician.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { jobCards: true } } },
    });
  },

  async create(data: Prisma.TechnicianCreateInput) {
    return prisma.technician.create({ data });
  },

  async update(id: string, data: Prisma.TechnicianUpdateInput) {
    return prisma.technician.update({ where: { id }, data });
  },

  // Soft-deactivate rather than hard-delete: a technician with historical
  // job cards must remain resolvable in JobCard.technician relations.
  async deactivate(id: string) {
    return prisma.technician.update({ where: { id }, data: { isActive: false } });
  },
};
