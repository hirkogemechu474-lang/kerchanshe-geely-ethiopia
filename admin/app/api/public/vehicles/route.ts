import { NextResponse } from 'next/server';
import { listPublicVehicles } from '@/lib/services/vehicles/publicVehicleService';

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

    const vehicles = await listPublicVehicles({ category, brand, limit });

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
