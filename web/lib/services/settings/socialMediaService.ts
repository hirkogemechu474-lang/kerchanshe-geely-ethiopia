import { settingRepository } from '@/repositories/settingRepository';

const DEFAULT_LINKS = {
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  linkedin: '',
  tiktok: '',
};

export async function getSocialMediaLinks() {
  const socialMedia = await settingRepository.findByKey('social_media_links');

  if (!socialMedia) {
    return DEFAULT_LINKS;
  }

  return JSON.parse(socialMedia.value);
}

export async function updateSocialMediaLinks(body: { facebook?: string; instagram?: string; twitter?: string; youtube?: string; linkedin?: string; tiktok?: string }) {
  const { facebook, instagram, twitter, youtube, linkedin, tiktok } = body;

  const socialMediaLinks = {
    facebook: facebook || '',
    instagram: instagram || '',
    twitter: twitter || '',
    youtube: youtube || '',
    linkedin: linkedin || '',
    tiktok: tiktok || '',
  };

  await settingRepository.upsert('social_media_links', JSON.stringify(socialMediaLinks), 'social');

  return socialMediaLinks;
}
