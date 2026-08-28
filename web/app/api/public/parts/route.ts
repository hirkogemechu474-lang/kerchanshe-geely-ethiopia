import { NextResponse } from 'next/server';
import { getPartsPageData } from '@/lib/services/parts/partsPageService';

// GET - Fetch all data needed for the /parts page
export async function GET() {
  try {
    const data = await getPartsPageData();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('Error fetching parts page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parts data' },
      { status: 500 }
    );
  }
}
