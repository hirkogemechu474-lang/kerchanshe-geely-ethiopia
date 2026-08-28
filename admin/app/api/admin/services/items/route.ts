import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listItems, createItem } from '@/lib/services/services/servicesCmsService';

// GET - List all service items
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    const items = await listItems(sectionId);

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error('Error fetching service items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service items' },
      { status: 500 }
    );
  }
}

// POST - Create new service item
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const item = await createItem(body);

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error creating service item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service item' },
      { status: 500 }
    );
  }
}
