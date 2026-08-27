import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Fetch single charging station
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const station = await contentRepository.findChargingStationById(id);

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    return NextResponse.json({ station });
  } catch (error) {
    console.error('Error fetching charging station:', error);
    return NextResponse.json({ error: 'Failed to fetch station' }, { status: 500 });
  }
}

// PUT - Update charging station
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const station = await contentRepository.updateChargingStation(id, {
      name,
      address,
      city,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      stationType,
      chargerCount,
      maxPower,
      connector,
      availability,
      pricing,
      hours,
      amenities,
      images,
      electricPage: electricPageId === undefined ? undefined : electricPageId === null ? { disconnect: true } : { connect: { id: electricPageId } },
      isActive,
    });

    return NextResponse.json({ station });
  } catch (error) {
    console.error('Error updating charging station:', error);
    return NextResponse.json({ error: 'Failed to update station' }, { status: 500 });
  }
}

// DELETE - Delete charging station
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    await contentRepository.deleteChargingStation(id);

    return NextResponse.json({ success: true, message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting charging station:', error);
    return NextResponse.json({ error: 'Failed to delete station' }, { status: 500 });
  }
}
