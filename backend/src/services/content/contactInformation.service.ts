import { settingRepository } from '../../repositories';

export const contactInformationService = {
  async get(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const keys = [
        'contact_phone',
        'contact_email',
        'contact_address',
        'contact_working_hours',
        'contact_map_lat',
        'contact_map_lng',
      ];

      const settings = await settingRepository.findManyByKeys(keys);
      const result = settings.reduce((acc, s) => {
        const key = s.key.replace('contact_', '');
        acc[key] = s.value;
        return acc;
      }, {} as Record<string, string>);

      return { ok: true, data: result };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch contact information.' };
    }
  },

  async update(data: Record<string, string>): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const results = await Promise.all(
        Object.entries(data).map(([key, value]) =>
          settingRepository.upsert(`contact_${key}`, value, 'contact')
        )
      );
      return { ok: true, data: results };
    } catch (error: any) {
      console.error('[CONTACT INFO UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update contact information.' };
    }
  },
};
