import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get services menu for frontend
export async function GET() {
  try {
    // Fetch all published service pages to validate item URLs
    const pages = await prisma.servicePage.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
    const publishedSlugs = new Set(pages.map((p) => p.slug));

    const sections = await prisma.serviceSection.findMany({
      where: {
        isActive: true,
      },
      include: {
        items: {
          where: {
            isActive: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Only expose items that resolve to a real page or a known route
    const filteredSections = sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.url) return false;
          // Direct static routes that always exist
          const staticRoutes = [
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
          if (staticRoutes.includes(item.url)) return true;
          // Dynamic /services/{slug} route -> validate against published pages
          if (item.url.startsWith('/services/')) {
            const slug = item.url.replace('/services/', '');
            return publishedSlugs.has(slug);
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);

    return NextResponse.json({
      success: true,
      sections: filteredSections,
    });
  } catch (error) {
    console.error('Error fetching services menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services menu', sections: [] },
      { status: 500 }
    );
  }
}
