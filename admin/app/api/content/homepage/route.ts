import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getHomepageContent, saveHomepageContent } from '@/lib/services/content/homepageContentService';

// GET - Fetch homepage content
export async function GET(request: NextRequest) {
  const content = await getHomepageContent();
  return NextResponse.json(content);
}

// POST - Save homepage content (admin only)
export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    await saveHomepageContent(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving homepage content:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
