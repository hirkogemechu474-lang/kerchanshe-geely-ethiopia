import { NextRequest, NextResponse } from 'next/server';
import { getPublicContent } from '@/lib/services/content/publicContentService';

// GET - Fetch homepage content for public website
export async function GET(request: NextRequest) {
  const content = await getPublicContent();
  return NextResponse.json(content);
}
