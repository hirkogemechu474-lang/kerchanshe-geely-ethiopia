import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all active categories (public)
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.vehicleCategory.findMany({
      where: { isActive: true },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            vehicles: {
              where: {
                isActive: true,
                status: 'published',
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  } 
}
