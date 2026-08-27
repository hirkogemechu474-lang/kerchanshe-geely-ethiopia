import { NextResponse } from 'next/server';
import { vehicleRepository } from '@/repositories/vehicleRepository';

/**
 * GET /api/public/vehicles
 * Get all active, published vehicles for public display
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const vehicles = await vehicleRepository.findPublicList({
      category,
      featured: featured === 'true',
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
