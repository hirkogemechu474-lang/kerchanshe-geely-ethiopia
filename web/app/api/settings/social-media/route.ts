import { NextRequest, NextResponse } from 'next/server';
import { getSocialMediaLinks, updateSocialMediaLinks } from '@/lib/services/settings/socialMediaService';

// GET social media links
export async function GET() {
  try {
    const links = await getSocialMediaLinks();
    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching social media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media links' },
      { status: 500 }
    );
  }
}

// POST - Update social media links
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const socialMediaLinks = await updateSocialMediaLinks(body);

    return NextResponse.json({ success: true, data: socialMediaLinks });
  } catch (error) {
    console.error('Error updating social media:', error);
    return NextResponse.json(
      { error: 'Failed to update social media links' },
      { status: 500 }
    );
  }
}
