import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch approved testimonials
export async function GET(request: NextRequest) {
  try {
    const testimonials = await prisma.review.findMany({
      where: {
        status: 'approved',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}
