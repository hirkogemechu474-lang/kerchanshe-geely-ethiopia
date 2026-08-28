import { NextResponse } from 'next/server';
import { getServicesMenu } from '@/lib/services/services/serviceCmsService';

// GET - Get services menu for frontend
export async function GET() {
  try {
    const sections = await getServicesMenu();

    return NextResponse.json({
      success: true,
      sections,
    });
  } catch (error) {
    console.error('Error fetching services menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services menu', sections: [] },
      { status: 500 }
    );
  }
}
