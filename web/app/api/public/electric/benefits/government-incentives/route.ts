import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get government incentives benefit page
    const page = await prisma.electricPage.findFirst({
      where: {
        slug: 'government-incentives',
        isPublished: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          page: {
            title: 'Government Incentives',
            slug: 'government-incentives',
            pageType: 'benefits-government-incentives',
            heroTitle: 'Government Incentives & Tax Benefits',
            heroSubtitle: 'Save More With Government Support',
            heroImage: null,
            content: 'Learn about available government incentives for electric vehicle owners in Ethiopia',
            description: 'Learn about available government incentives for electric vehicle owners in Ethiopia',
            sections: [],
            metadata: {},
            isPublished: false,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      page: {
        ...page,
        description: page.content,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching government incentives page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch government incentives page' },
      { status: 500 }
    );
  } 
}
