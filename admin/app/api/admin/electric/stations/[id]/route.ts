import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

// GET - Fetch single charging station
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const station = await prisma.chargingStation.findUnique({
      where: { id: params.id },
    });

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    return NextResponse.json({ station });
  } catch (error) {
    console.error('Error fetching station:', error);
    return NextResponse.json({ error: 'Failed to fetch station' }, { status: 500 });
  } 
}

// PUT - Update charging station
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
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
      isActive,
    } = body;

    const station = await prisma.chargingStation.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(stationType && { stationType }),
        ...(chargerCount !== undefined && { chargerCount: parseInt(chargerCount) }),
        ...(maxPower && { maxPower }),
        ...(connector && { connector }),
        ...(availability && { availability }),
        ...(pricing !== undefined && { pricing }),
        ...(hours !== undefined && { hours }),
        ...(amenities && { amenities }),
        ...(images && { images }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ station });
  } catch (error) {
    console.error('Error updating station:', error);
    return NextResponse.json({ error: 'Failed to update station' }, { status: 500 });
  } 
}

// DELETE - Delete charging station
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const station = await prisma.chargingStation.findUnique({
      where: { id: params.id },
    });

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    await prisma.chargingStation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    return NextResponse.json({ error: 'Failed to delete station' }, { status: 500 });
  } 
}
