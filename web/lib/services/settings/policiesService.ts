import { settingRepository } from '@/repositories/settingRepository';

export async function getPolicies() {
  const policies = await settingRepository.findManyByType('policy');

  const policiesObject: Record<string, any> = {};
  policies.forEach((policy) => {
    policiesObject[policy.key] = {
      id: policy.id,
      content: policy.value,
      updatedAt: policy.updatedAt,
    };
  });

  return policiesObject;
}

export async function updatePolicies(body: { privacy?: string; terms?: string; cookies?: string }) {
  const { privacy, terms, cookies } = body;
  const updates: Promise<unknown>[] = [];

  if (privacy !== undefined) {
    updates.push(settingRepository.upsert('privacy_policy', privacy, 'policy'));
  }
  if (terms !== undefined) {
    updates.push(settingRepository.upsert('terms_of_service', terms, 'policy'));
  }
  if (cookies !== undefined) {
    updates.push(settingRepository.upsert('cookie_policy', cookies, 'policy'));
  }

  await Promise.all(updates);
}
