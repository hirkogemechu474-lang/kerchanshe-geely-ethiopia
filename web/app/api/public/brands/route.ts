import { NextResponse } from 'next/server';
import { contentRepository } from '@/repositories/contentRepository';

export async function GET() {
  try {
    const brands = await contentRepository.findActiveBrands();
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}
