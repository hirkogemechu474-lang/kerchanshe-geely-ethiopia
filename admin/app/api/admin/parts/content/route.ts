import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getContent, updateContent } from '@/lib/services/parts/partsContentService';

// GET - Fetch parts page content (the single record)
export async function GET() {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const content = await getContent();

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching parts content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// PUT - Update parts page content
export async function PUT(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const content = await updateContent(body);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error updating parts content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
