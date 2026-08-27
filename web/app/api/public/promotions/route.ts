import { NextResponse } from 'next/server';
import { promotionRepository } from '@/repositories/promotionRepository';

export async function GET() {
  try {
    const promotions = await promotionRepository.findActive();

    return NextResponse.json({
      success: true,
      promotions,
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promotions',
        promotions: [],
      },
      { status: 500 }
    );
  }
}
