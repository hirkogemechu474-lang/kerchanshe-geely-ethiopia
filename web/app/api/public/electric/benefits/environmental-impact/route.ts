import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get environmental impact benefit page
    const page = await prisma.electricPage.findFirst({
      where: {
        slug: 'environmental-impact',
        isPublished: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          page: {
            title: 'Environmental Impact',
            slug: 'environmental-impact',
            pageType: 'benefits-environmental-impact',
            heroTitle: 'Your Impact on the Environment',
            heroSubtitle: 'Drive Sustainably',
            heroImage: null,
            content: 'Learn about the positive environmental impact of switching to an electric vehicle',
            description: 'Learn about the positive environmental impact of switching to an electric vehicle',
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
    console.error('Error fetching environmental impact page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environmental impact page' },
      { status: 500 }
    );
  } 
}
