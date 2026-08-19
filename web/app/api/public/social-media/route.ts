import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'social_media_links';

const DEFAULT_SOCIAL_MEDIA = [
  {
    id: '1',
    platform: 'facebook',
    url: 'https://www.facebook.com/geelyethiopia',
    handle: '@geelyethiopia',
    active: true,
    followers: '25K+',
  },
  {
    id: '2',
    platform: 'instagram',
    url: 'https://www.instagram.com/geelyethiopia',
    handle: '@geelyethiopia',
    active: true,
    followers: '18K+',
  },
  {
    id: '3',
    platform: 'twitter',
    url: 'https://twitter.com/geelyethiopia',
    handle: '@geelyethiopia',
    active: true,
    followers: '8K+',
  },
  {
    id: '4',
    platform: 'youtube',
    url: 'https://www.youtube.com/@geelyethiopia',
    handle: '@geelyethiopia',
    active: true,
    followers: '5K+',
  },
  {
    id: '5',
    platform: 'linkedin',
    url: 'https://www.linkedin.com/company/geely-ethiopia',
    handle: 'Geely Ethiopia',
    active: true,
    followers: '3K+',
  },
  {
    id: '6',
    platform: 'tiktok',
    url: 'https://www.tiktok.com/@geelyethiopia',
    handle: '@geelyethiopia',
    active: true,
    followers: '12K+',
  },
  {
    id: '7',
    platform: 'telegram',
    url: 'https://t.me/geelyethiopia',
    handle: '@geelyethiopia',
    active: true,
    followers: '15K+',
  },
];

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_SOCIAL_MEDIA);
    }

    const rawData = JSON.parse(setting.value);

    if (Array.isArray(rawData)) {
      return NextResponse.json(rawData);
    }

    if (typeof rawData === 'object' && rawData !== null) {
      const list = Object.keys(rawData)
        .filter((key) => rawData[key])
        .map((platform, index) => ({
          id: String(index + 1),
          platform: platform,
          url: rawData[platform],
          handle: '',
          active: true,
          followers: '',
        }));
      return NextResponse.json(list);
    }

    return NextResponse.json(DEFAULT_SOCIAL_MEDIA);
  } catch (error) {
    console.error('Error fetching social media:', error);
    return NextResponse.json(DEFAULT_SOCIAL_MEDIA);
  }
}
