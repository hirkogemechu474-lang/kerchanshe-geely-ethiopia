import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get active showcases for frontend
export async function GET() {
  try {
    const showcases = await prisma.vehicleShowcase.findMany({
      where: {
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ showcases });
  } catch (error) {
    console.error('Error fetching showcases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcases' },
      { status: 500 }
    );
  }
}
