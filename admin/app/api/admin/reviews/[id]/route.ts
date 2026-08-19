import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { sendStatusEmail } from '@/lib/status-email';

interface Params {
  id: string;
}

// GET - Fetch single review
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  } 
}

// PUT - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      isFeatured,
      isActive,
      reviewTitle,
      reviewMessage,
    } = body;

    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
        ...(reviewTitle && { reviewTitle }),
        ...(reviewMessage && { reviewMessage }),
      },
    });

    if (status && ['approved', 'rejected'].includes(status) && review.email) {
      try {
        await sendStatusEmail({
          to: review.email,
          name: review.fullName,
          entityType: 'Review',
          status,
          reference: review.id,
          details: review.reviewTitle,
        });
      } catch (error) {
        console.error('[status-email] review', error);
      }
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  } 
}

// DELETE - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.review.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  } 
}
