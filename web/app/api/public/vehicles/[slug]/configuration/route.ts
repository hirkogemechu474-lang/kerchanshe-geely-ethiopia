import { NextResponse } from 'next/server';
import { vehicleRepository } from '@/repositories/vehicleRepository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const vehicle = await vehicleRepository.findPublishedIdBySlugOrId(slug);

    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

    const configuration = await vehicleRepository.findConfiguration(vehicle.id);

    return NextResponse.json(configuration);
  } catch (error) {
    console.error('Error fetching vehicle configuration:', error);
    return NextResponse.json({ error: 'Failed to load vehicle configuration' }, { status: 500 });
  }
}
