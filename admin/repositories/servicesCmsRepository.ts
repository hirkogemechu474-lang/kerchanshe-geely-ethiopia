/**
 * ServicesCmsRepository — server-only Prisma queries for the admin
 * Services CMS (sections, pages, items).
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const servicesCmsRepository = {
  // ── Sections ─────────────────────────────────────────────────────────
  async findAllSections() {
    return prisma.serviceSection.findMany({
      include: { items: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
  },
  async createSection(data: Prisma.ServiceSectionCreateInput) {
    return prisma.serviceSection.create({ data });
  },
  async findSectionById(id: string) {
    return prisma.serviceSection.findUnique({
      where: { id },
      include: { items: { orderBy: { displayOrder: 'asc' } } },
    });
  },
  async updateSection(id: string, data: Prisma.ServiceSectionUpdateInput) {
    return prisma.serviceSection.update({ where: { id }, data });
  },
  async deleteSection(id: string) {
    return prisma.serviceSection.delete({ where: { id } });
  },

  // ── Pages ────────────────────────────────────────────────────────────
  async findAllPages() {
    return prisma.servicePage.findMany({ orderBy: { updatedAt: 'desc' } });
  },
  async createPage(data: Prisma.ServicePageCreateInput) {
    return prisma.servicePage.create({ data });
  },
  async findPageById(id: string) {
    return prisma.servicePage.findUnique({ where: { id } });
  },
  async updatePage(id: string, data: Prisma.ServicePageUpdateInput) {
    return prisma.servicePage.update({ where: { id }, data });
  },
  async deletePage(id: string) {
    return prisma.servicePage.delete({ where: { id } });
  },

  // ── Items ────────────────────────────────────────────────────────────
  async findManyItems(sectionId: string | null) {
    return prisma.serviceItem.findMany({
      where: sectionId ? { sectionId } : {},
      include: { section: true },
      orderBy: { displayOrder: 'asc' },
    });
  },
  async createItem(data: Prisma.ServiceItemCreateInput) {
    return prisma.serviceItem.create({ data });
  },
  async findItemById(id: string) {
    return prisma.serviceItem.findUnique({ where: { id }, include: { section: true } });
  },
  async updateItem(id: string, data: Prisma.ServiceItemUpdateInput) {
    return prisma.serviceItem.update({ where: { id }, data });
  },
  async deleteItem(id: string) {
    return prisma.serviceItem.delete({ where: { id } });
  },
};
