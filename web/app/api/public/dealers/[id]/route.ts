import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/dealers/[id]
 * Get a single active dealer for public display.
 * Returns 404 only when the record genuinely does not exist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Dealer ID is required' }, { status: 400 });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id },
    });

    if (!dealer) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    // Only active dealers are publicly visible
    if (!dealer.active) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    const transformed = {
      id: dealer.id,
      name: dealer.name,
      type: dealer.type,
      description: dealer.description,
      website: dealer.website,
      logo: dealer.logo,
      gallery: dealer.gallery as string[],
      active: dealer.active,
      featured: dealer.featured,
      city: dealer.city,
      region: dealer.region,
      country: dealer.country,
      address: dealer.address as {
        street: string;
        area: string;
        city: string;
        region: string;
        country: string;
        postalCode: string;
      },
      coordinates: {
        lat: dealer.latitude,
        lng: dealer.longitude,
        latitude: dealer.latitude,
        longitude: dealer.longitude,
      },
      contact: dealer.contact as {
        phone: string;
        email: string;
        whatsapp: string;
      },
      phone: (dealer.contact as any)?.phone || '',
      email: (dealer.contact as any)?.email || '',
      services: dealer.services as string[],
      hours: dealer.workingHours as {
        weekday: string;
        saturday: string;
        sunday: string;
      },
      workingHours: dealer.workingHours as {
        weekdays: string;
        saturday: string;
        sunday: string;
      },
      facilities: dealer.facilities as {
        showroom: boolean;
        serviceCenter: boolean;
        partsShop: boolean;
        testDriveArea: boolean;
        customerLounge: boolean;
        parking: string;
      },
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealer' },
      { status: 500 }
    );
  }
}
