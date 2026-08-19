import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { sendFormEmail } from '@/lib/form-email';

// GET - Get reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const where: any = {};
    
    if (featured === 'true') {
      where.isFeatured = true;
    }

    where.status = 'approved'; // Only show approved reviews
    where.isActive = true;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    // Calculate stats
    const totalReviews = await prisma.review.count({
      where: { status: 'approved', isActive: true }
    });

    const avgRatingResult = await prisma.review.aggregate({
      where: { status: 'approved', isActive: true },
      _avg: { rating: true }
    });

    return NextResponse.json({
      reviews,
      total_reviews: totalReviews,
      average_rating: avgRatingResult._avg.rating || 0,
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

    // Create the review (will be pending approval)
    const review = await prisma.review.create({
      data: {
        fullName,
        email: email || null,
        vehicleModel,
        rating,
        reviewTitle,
        reviewMessage,
        status: 'pending', // Requires admin approval
        isFeatured: false,
        isActive: true,
      },
    });

    let notificationSent = false;
    if (email) {
      try {
        notificationSent = await sendFormEmail({
          type: 'customer review',
          name: fullName,
          email,
          subject: `New review: ${reviewTitle}`,
          reference: review.id,
          details: `Vehicle: ${vehicleModel}\nRating: ${rating}/5\n\n${reviewMessage}`,
        });
      } catch (emailError) {
        console.error('[review:email]', emailError);
      }
    }

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
