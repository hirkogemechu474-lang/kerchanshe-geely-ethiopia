import { NextResponse } from 'next/server';
import { listPublicDealers } from '@/lib/services/dealers/publicDealerService';

/**
 * GET /api/public/dealers
 * Public API for Web frontend to fetch dealers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const region = searchParams.get('region');

    const dealers = await listPublicDealers({ city, region });

    return NextResponse.json({
      success: true,
      data: dealers,
      count: dealers.length,
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}
