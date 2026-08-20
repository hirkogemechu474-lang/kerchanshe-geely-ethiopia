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
      // `category` may be a real VehicleCategory.slug (the system used by /admin/categories)
      // or the legacy free-text `category` column on older vehicles — match either.
      where.OR = [
        { vehicleCategory: { slug: category } },
        { category },
      ];
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
        categoryId: true,
        vehicleCategory: { select: { id: true, name: true, slug: true } },
        badge: true,
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
