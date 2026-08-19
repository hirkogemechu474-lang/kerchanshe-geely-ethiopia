import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get active FAQs for frontend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit ? parseInt(limit) : undefined,
    });

    // Get unique categories for filtering
    const categories = await prisma.fAQ.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    const uniqueCategories = categories
      .map(c => c.category)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);

    return NextResponse.json({
      success: true,
      faqs,
      categories: uniqueCategories,
      total: faqs.length,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}