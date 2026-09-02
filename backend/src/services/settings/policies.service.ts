import { settingRepository } from '../../repositories';

const POLICY_KEYS = [
  'policy_privacy',
  'policy_terms',
  'policy_warranty',
  'policy_returns',
  'policy_cookie',
];

export const policiesService = {
  async getAll(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const settings = await settingRepository.findManyByKeys(POLICY_KEYS);
      const result = settings.reduce((acc, s) => {
        const policyType = s.key.replace('policy_', '');
        acc[policyType] = s.value;
        return acc;
      }, {} as Record<string, string>);

      return { ok: true, data: result };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch policies.' };
    }
  },

  async get(type: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const setting = await settingRepository.findByKey(`policy_${type}`);
      return { ok: true, data: setting?.value ?? null };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch policy.' };
    }
  },

  async update(type: string, content: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const setting = await settingRepository.upsert(`policy_${type}`, content, 'policy');
      return { ok: true, data: setting };
    } catch (error: any) {
      console.error('[POLICY UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update policy.' };
    }
  },
};
