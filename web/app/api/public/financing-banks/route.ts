import { NextRequest, NextResponse } from 'next/server';
import { financingRepository } from '@/repositories/financingRepository';

// GET /api/public/financing-banks
// Returns all ACTIVE banks (partner directory)
export async function GET(_req: NextRequest) {
  try {
    const banks = await financingRepository.findActiveBanksWithProgramCount();
    return NextResponse.json(banks, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('[public:financing-banks:get]', error);
    return NextResponse.json([], { status: 500 });
  }
}
