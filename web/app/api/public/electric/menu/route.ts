import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sections = await prisma.electricSection.findMany({
      where: {
        isActive: true,
      },
      include: {
        items: {
          where: {
            isActive: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
          include: {
            page: {
              where: {
                isPublished: true,
              },
              select: {
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Only expose items that resolve to a destination (has a url OR a published page)
    const filteredSections = sections
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => Boolean(item.url) || Boolean(item.page?.slug))
          .map((item) => ({
            ...item,
            // If no explicit url but has a published page, derive a working url
            url:
              item.url ||
              (item.page?.slug ? `/electric/${item.page.slug}` : item.url),
          })),
      }))
      .filter((section) => section.items.length > 0);

    return NextResponse.json({ sections: filteredSections });
  } catch (error) {
    console.error('Error fetching electric menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch electric menu' },
      { status: 500 }
    );
  }
}
