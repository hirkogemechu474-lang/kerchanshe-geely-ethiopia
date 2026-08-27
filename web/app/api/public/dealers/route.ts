import { NextResponse } from 'next/server';
import { dealerRepository } from '@/repositories/dealerRepository';
import { toPublicDealer } from '@/lib/services/dealers/dealerService';

/**
 * GET /api/public/dealers
 * Get all active dealers for public display
 */
export async function GET() {
  try {
    const dealers = await dealerRepository.findAllActive();
    return NextResponse.json(dealers.map(toPublicDealer));
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}
