import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - List all charging stations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const electricPageId = searchParams.get('electricPageId');

    const where = electricPageId ? { electricPageId } : {};

    const stations = await prisma.chargingStation.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        electricPage: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ stations });
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  } 
}

// POST - Create new charging station
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const station = await prisma.chargingStation.create({
      data: {
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
        electricPageId,
        isActive: isActive ?? true,
      },
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
