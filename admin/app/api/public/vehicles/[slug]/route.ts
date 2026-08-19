import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/vehicles/[slug]
 * Get single vehicle by slug for Web frontend
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        vehicleCategory: true,
        brand: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}