import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

interface Params {
  id: string;
}

// GET - Fetch single promotion
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id },
    });

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return NextResponse.json({ error: 'Failed to fetch promotion' }, { status: 500 });
  } 
}

// PUT - Update promotion
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();

    if (!body.title || !body.description || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'Title, description, start date, and end date are required' }, { status: 400 });
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      return NextResponse.json({ error: 'Please provide a valid promotion date range' }, { status: 400 });
    }

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        startDate,
        endDate,
        ...(body.bannerImage !== undefined && { bannerImage: body.bannerImage }),
        ...(body.ctaButtonText !== undefined && { ctaButtonText: body.ctaButtonText }),
        ...(body.ctaButtonLink !== undefined && { ctaButtonLink: body.ctaButtonLink }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
      },
    });

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 });
  } 
}

// DELETE - Delete promotion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    await prisma.promotion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
  } 
}
