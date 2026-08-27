import { NextResponse } from 'next/server';
import { dealerRepository } from '@/repositories/dealerRepository';
import { toPublicDealer } from '@/lib/services/dealers/dealerService';

/**
 * GET /api/public/dealers/[id]
 * Get a single active dealer for public display.
 * Returns 404 only when the record genuinely does not exist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Dealer ID is required' }, { status: 400 });
    }

    const dealer = await dealerRepository.findActiveById(id);

    if (!dealer) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    return NextResponse.json(toPublicDealer(dealer));
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealer' },
      { status: 500 }
    );
  }
}
