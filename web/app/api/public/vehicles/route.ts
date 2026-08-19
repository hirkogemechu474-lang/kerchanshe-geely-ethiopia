import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/vehicles
 * Get all active, published vehicles for public display
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const where: any = {
      isActive: true,
      status: 'published',
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        model: true,
        year: true,
        category: true,
        description: true,
        images: true,
        specifications: true,
        basePrice: true,
        finalPrice: true,
        hidePrice: true,
        discountAmount: true,
        isFeatured: true,
        heroImageUrl: true,
        heroVideoUrl: true,
        status: true,
      },
    });

    return NextResponse.json(vehicles, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}
