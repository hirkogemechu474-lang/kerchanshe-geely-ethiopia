import { serviceCmsRepository } from '@/repositories/serviceCmsRepository';

// GET - Fetch single published service page by slug
export async function getPublishedPage(slug: string) {
  return serviceCmsRepository.findPublishedPageBySlug(slug);
}

const STATIC_ROUTES = [
  '/parts',
  '/test-drive',
  '/quote',
  '/trade-in',
  '/financing',
  '/warranty',
  '/roadside',
  '/service-booking',
  '/dealers',
  '/services',
  '/service',
];

// GET - Get services menu for frontend
export async function getServicesMenu() {
  // Fetch all published service pages to validate item URLs
  const pages = await serviceCmsRepository.findPublishedPageSlugs();
  const publishedSlugs = new Set(pages.map((p) => p.slug));

  const sections = await serviceCmsRepository.findActiveSectionsWithItems();

  // Only expose items that resolve to a real page or a known route
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.url) return false;
        // Direct static routes that always exist
        if (STATIC_ROUTES.includes(item.url)) return true;
        // Dynamic /services/{slug} route -> validate against published pages
        if (item.url.startsWith('/services/')) {
          const slug = item.url.replace('/services/', '');
          return publishedSlugs.has(slug);
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return filteredSections;
}
