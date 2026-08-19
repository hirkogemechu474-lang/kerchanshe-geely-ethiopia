import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        slug: slug,
        isActive: true,
        status: 'published',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        model: true,
        year: true,
        category: true,
        badge: true,
        description: true,
        images: true,
        specifications: true,
        basePrice: true,
        finalPrice: true,
        hidePrice: true,
        discountAmount: true,
        taxRate: true,
        isFeatured: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        vehicleCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        heroImageUrl: true,
        heroVideoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const relatedVehicles = await prisma.vehicle.findMany({
      where: {
        category: vehicle.category,
        slug: { not: vehicle.slug },
        isActive: true,
        status: 'published',
      },
      orderBy: [
        { displayOrder: 'asc' },
        { isFeatured: 'desc' },
        { name: 'asc' },
      ],
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        basePrice: true,
        finalPrice: true,
        hidePrice: true,
        images: true,
        heroImageUrl: true,
        badge: true,
      },
    });

    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

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
