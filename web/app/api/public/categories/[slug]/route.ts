import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch single category by slug with vehicles (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const category = await prisma.vehicleCategory.findUnique({
      where: { 
        slug,
        isActive: true,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        vehicles: {
          where: {
            isActive: true,
            status: 'published',
          },
          select: {
            id: true,
            name: true,
            slug: true,
            model: true,
            year: true,
            description: true,
            images: true,
            specifications: true,
            basePrice: true,
            finalPrice: true,
            hidePrice: true,
            discountAmount: true,
            discountType: true,
            badge: true,
            isFeatured: true,
            heroImageUrl: true,
            heroVideoUrl: true,
          },
          orderBy: [
            { isFeatured: 'desc' },
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  } 
}
