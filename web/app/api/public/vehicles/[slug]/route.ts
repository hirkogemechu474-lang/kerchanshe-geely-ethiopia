import { NextResponse } from 'next/server';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { settingRepository } from '@/repositories/settingRepository';

const SETTING_KEY = 'vehicle_settings';

/**
 * GET /api/public/vehicles/[slug]
 * Get a single vehicle by slug for public display
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const vehicle = await vehicleRepository.findPublicBySlug(slug);

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const relatedVehicles = await vehicleRepository.findRelated(vehicle.category, vehicle.slug);

    const setting = await settingRepository.findByKey(SETTING_KEY);

    let brochure: any = null;
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        brochure = parsed?.brochure ?? null;
      } catch {
        brochure = null;
      }
    }

    return NextResponse.json({
      ...vehicle,
      relatedVehicles,
      brochure,
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}
