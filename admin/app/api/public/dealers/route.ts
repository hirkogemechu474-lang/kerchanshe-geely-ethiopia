import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/dealers
 * Public API for Web frontend to fetch dealers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const region = searchParams.get('region');

    const where: any = {
      active: true,
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (region) {
      where.region = { contains: region, mode: 'insensitive' };
    }

    const dealers = await prisma.dealer.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: dealers,
      count: dealers.length,
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}