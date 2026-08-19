import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all data needed for the /parts page
export async function GET() {
  try {
    const [content, categories, featuredParts, brands, benefits] = await Promise.all([
      prisma.partsPageContent.findFirst(),
      prisma.partCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.sparePart.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: { partCategory: true },
      }),
      prisma.partBrand.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.partBenefit.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    // Include a few non-featured parts so the catalog isn't empty
    const extraParts = await prisma.sparePart.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: { partCategory: true },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      content,
      categories,
      parts: featuredParts.length > 0 ? featuredParts : extraParts,
      featuredParts,
      brands,
      benefits,
    });
  } catch (error) {
    console.error('Error fetching parts page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parts data' },
      { status: 500 }
    );
  } 
}