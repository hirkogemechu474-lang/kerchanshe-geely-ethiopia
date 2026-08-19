import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get cost calculator benefit page
    const page = await prisma.electricPage.findFirst({
      where: {
        slug: 'cost-calculator',
        isPublished: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          page: {
            title: 'Cost Calculator',
            slug: 'cost-calculator',
            pageType: 'benefits-cost-calculator',
            heroTitle: 'Calculate Your Savings',
            heroSubtitle: 'Discover How Much You\'ll Save',
            heroImage: null,
            content: 'See how much you can save by switching to an electric vehicle',
            description: 'See how much you can save by switching to an electric vehicle',
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
    console.error('Error fetching cost calculator page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost calculator page' },
      { status: 500 }
    );
  } 
}
