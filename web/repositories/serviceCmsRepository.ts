/**
 * ServiceCmsRepository — server-only, read-only Prisma queries for the
 * public Services CMS (sections/items/pages authored in admin).
 */
import { prisma } from '@/lib/prisma';

export const serviceCmsRepository = {
  async findPublishedPageBySlug(slug: string) {
    return prisma.servicePage.findFirst({ where: { slug, isPublished: true } });
  },

  async findPublishedPageSlugs() {
    return prisma.servicePage.findMany({ where: { isPublished: true }, select: { slug: true } });
  },

  async findActiveSectionsWithItems() {
    return prisma.serviceSection.findMany({
      where: { isActive: true },
      include: {
        items: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
      },
      orderBy: { displayOrder: 'asc' },
    });
  },
};
