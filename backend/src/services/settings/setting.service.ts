import { settingRepository } from '../../repositories';

export const settingService = {
  async get(key: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const setting = await settingRepository.findByKey(key);
      return { ok: true, data: setting?.value ?? null };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch setting.' };
    }
  },

  async getByType(type: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const settings = await settingRepository.findManyByType(type);
      return { ok: true, data: settings };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch settings.' };
    }
  },

  async getMultiple(keys: string[]): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const settings = await settingRepository.findManyByKeys(keys);
      const result = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
      return { ok: true, data: result };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch settings.' };
    }
  },

  async upsert(key: string, value: string, type: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const setting = await settingRepository.upsert(key, value, type);
      return { ok: true, data: setting };
    } catch (error: any) {
      console.error('[SETTING UPSERT ERROR]', error.message);
      return { ok: false, error: 'Failed to upsert setting.' };
    }
  },

  async upsertMultiple(settings: Array<{ key: string; value: string; type: string }>): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const results = await Promise.all(
        settings.map((s) => settingRepository.upsert(s.key, s.value, s.type))
      );
      return { ok: true, data: results };
    } catch (error: any) {
      console.error('[SETTING UPSERT MULTIPLE ERROR]', error.message);
      return { ok: false, error: 'Failed to upsert settings.' };
    }
  },
};
