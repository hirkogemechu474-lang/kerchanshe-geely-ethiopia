import { NextResponse } from 'next/server';
import { reviewRepository } from '@/repositories/reviewRepository';

// GET - Fetch approved testimonials
export async function GET() {
  try {
    const testimonials = await reviewRepository.findApproved();
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}
