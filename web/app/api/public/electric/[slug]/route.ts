import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  slug: string;
}

// GET - Fetch single published electric page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // First try ElectricMenuPage (pages created from the admin menu system)
    const menuPage = await prisma.electricMenuPage.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      include: {
        item: {
          include: {
            section: true,
          },
        },
      },
    });

    if (menuPage) {
      return NextResponse.json({
        page: {
          id: menuPage.id,
          title: menuPage.title,
          slug: menuPage.slug,
          pageType: menuPage.item?.section?.slug || 'custom',
          heroTitle: menuPage.title,
          heroSubtitle: menuPage.excerpt || null,
          heroImage: menuPage.heroImage || null,
          content: menuPage.content,
          sections: null,
          metadata: {
            metaTitle: menuPage.metaTitle,
            metaDescription: menuPage.metaDescription,
          },
          chargingStations: [],
        },
      });
    }

    // Fall back to the legacy ElectricPage model
    const page = await prisma.electricPage.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      include: {
        chargingStations: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching electric page:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  } 
}
