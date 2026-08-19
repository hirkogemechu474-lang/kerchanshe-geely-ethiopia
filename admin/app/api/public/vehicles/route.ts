import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/vehicles
 * Public API for Web frontend to fetch vehicles
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.vehicleCategory = { slug: category };
    }

    if (brand) {
      where.brand = { slug: brand };
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      take: limit,
      include: {
        vehicleCategory: true,
        brand: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}
