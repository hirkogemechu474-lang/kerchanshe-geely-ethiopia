import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  slug: string;
}

// GET - Fetch single published service page by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await prisma.servicePage.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('Error fetching service page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  } 
}
