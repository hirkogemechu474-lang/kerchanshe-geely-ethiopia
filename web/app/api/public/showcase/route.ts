import { NextResponse } from 'next/server';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Get active showcases for frontend
export async function GET() {
  try {
    const showcases = await contentRepository.findActiveShowcases();
    return NextResponse.json({ showcases });
  } catch (error) {
    console.error('Error fetching showcases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcases' },
      { status: 500 }
    );
  }
}
