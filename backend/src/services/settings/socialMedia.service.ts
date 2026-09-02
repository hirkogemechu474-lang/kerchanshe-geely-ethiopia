import { settingRepository } from '../../repositories';

const SOCIAL_MEDIA_KEYS = [
  'social_facebook',
  'social_twitter',
  'social_instagram',
  'social_youtube',
  'social_linkedin',
  'social_tiktok',
];

export const socialMediaService = {
  async getAll(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const settings = await settingRepository.findManyByKeys(SOCIAL_MEDIA_KEYS);
      const result = settings.reduce((acc, s) => {
        const platform = s.key.replace('social_', '');
        acc[platform] = s.value;
        return acc;
      }, {} as Record<string, string>);

      return { ok: true, data: result };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch social media links.' };
    }
  },

  async update(platform: string, url: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const key = `social_${platform}`;
      const setting = await settingRepository.upsert(key, url, 'social_media');
      return { ok: true, data: setting };
    } catch (error: any) {
      console.error('[SOCIAL MEDIA UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update social media link.' };
    }
  },

  async updateMultiple(links: Record<string, string>): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const results = await Promise.all(
        Object.entries(links).map(([platform, url]) =>
          settingRepository.upsert(`social_${platform}`, url, 'social_media')
        )
      );
      return { ok: true, data: results };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update social media links.' };
    }
  },
};
