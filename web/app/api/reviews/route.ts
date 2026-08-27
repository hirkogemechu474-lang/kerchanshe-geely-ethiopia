import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { reviewRepository } from '@/repositories/reviewRepository';
import { submitReview } from '@/lib/services/reviews/reviewService';

// GET - Get reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const [reviews, totalReviews, averageRating] = await Promise.all([
      reviewRepository.findApprovedActive({
        featured: featured === 'true',
        limit: limit ? parseInt(limit) : undefined,
      }),
      reviewRepository.countApprovedActive(),
      reviewRepository.averageApprovedActiveRating(),
    ]);

    return NextResponse.json({
      reviews,
      total_reviews: totalReviews,
      average_rating: averageRating,
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Submit a new review
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.review);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();

    const {
      fullName,
      email,
      vehicleModel,
      rating,
      reviewTitle,
      reviewMessage,
    } = body;

    // Validate required fields
    if (!fullName || !vehicleModel || !rating || !reviewTitle || !reviewMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { review, notificationSent } = await submitReview({
      fullName,
      email,
      vehicleModel,
      rating,
      reviewTitle,
      reviewMessage,
    });

    return NextResponse.json({
      message: 'Review submitted successfully',
      reviewId: review.id,
      notificationSent,
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
