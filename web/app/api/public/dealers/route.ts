import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/dealers
 * Get all active dealers for public display
 */
export async function GET() {
  try {
    const dealers = await prisma.dealer.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' },
      ],
    });

    // Transform to match the Dealer interface expected by the frontend
    const transformedDealers = dealers.map(dealer => ({
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
    }));

    return NextResponse.json(transformedDealers);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}
