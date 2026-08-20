import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

// GET - List all charging stations
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    const stations = await prisma.chargingStation.findMany({
      orderBy: { name: 'asc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const total = await prisma.chargingStation.count();

    return NextResponse.json({
      stations,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
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
      isActive,
    } = body;

    if (!name || !address || !city || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        chargerCount: parseInt(chargerCount),
        maxPower,
        connector: connector || [],
        availability,
        pricing,
        hours,
        amenities: amenities || [],
        images: images || [],
        isActive,
      },
    });

    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    console.error('Error creating station:', error);
    return NextResponse.json(
      { error: 'Failed to create station' },
      { status: 500 }
    );
  } 
}
