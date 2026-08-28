import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { reviewRepository } from '@/repositories/reviewRepository';
import { updateReview } from '@/lib/services/reviews/reviewService';

type Params = Promise<{ id: string }>;

// GET - Fetch single review
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    const review = await reviewRepository.findById(id);

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
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    const review = await updateReview(id, body);

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
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    await reviewRepository.delete(id);

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
