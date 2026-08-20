import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - Fetch all promotions
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const promotions = await prisma.promotion.findMany({
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
        { startDate: 'desc' },
      ],
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  } 
}

// POST - Create promotion
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      bannerImage,
      ctaButtonText,
      ctaButtonLink,
      isFeatured,
      isActive,
      displayOrder,
    } = body;

    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        bannerImage: bannerImage || null,
        ctaButtonText: ctaButtonText || null,
        ctaButtonLink: ctaButtonLink || null,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    );
  } 
}
