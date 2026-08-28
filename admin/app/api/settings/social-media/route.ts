import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { settingRepository } from '@/repositories/settingRepository';

// GET social media links
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const socialMedia = await settingRepository.findByKey('social_media_links');

    if (!socialMedia) {
      // Return default structure
      return NextResponse.json({
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
        tiktok: ''
      });
    }

    const links = JSON.parse(socialMedia.value);
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
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageSettings) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { facebook, instagram, twitter, youtube, linkedin, tiktok } = body;

    const socialMediaLinks = {
      facebook: facebook || '',
      instagram: instagram || '',
      twitter: twitter || '',
      youtube: youtube || '',
      linkedin: linkedin || '',
      tiktok: tiktok || ''
    };

    await settingRepository.upsert('social_media_links', JSON.stringify(socialMediaLinks), 'social');

    return NextResponse.json({ success: true, data: socialMediaLinks });
  } catch (error) {
    console.error('Error updating social media:', error);
    return NextResponse.json(
      { error: 'Failed to update social media links' },
      { status: 500 }
    );
  }
}
