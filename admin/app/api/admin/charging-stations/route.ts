import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - List all charging stations
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const electricPageId = searchParams.get('electricPageId');

    const stations = await contentRepository.findChargingStations(electricPageId);

    return NextResponse.json({ stations });
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}

// POST - Create new charging station
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const {
      name,
      address,
      city,
      latitude,
      longitude,
      stationType,
      chargerCount,
      maxPower,
      connector,
      availability,
      pricing,
      hours,
      amenities,
      images,
      electricPageId,
      isActive,
    } = body;

    if (!name || !address || !city || !latitude || !longitude || !stationType || !maxPower) {
      return NextResponse.json(
        { error: 'Required fields: name, address, city, latitude, longitude, stationType, maxPower' },
        { status: 400 }
      );
    }

    const station = await contentRepository.createChargingStation({
      name,
      address,
      city,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      stationType,
      chargerCount: chargerCount ?? 1,
      maxPower,
      connector,
      availability: availability || 'operational',
      pricing,
      hours,
      amenities,
      images,
      electricPage: electricPageId ? { connect: { id: electricPageId } } : undefined,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    console.error('Error creating charging station:', error);
    return NextResponse.json(
      { error: 'Failed to create station' },
      { status: 500 }
    );
  }
}
