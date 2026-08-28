import { settingRepository } from '@/repositories/settingRepository';

export type SettingResult<T extends object> =
  | ({ ok: true } & T)
  | { ok: false; httpStatus: 400 | 404; error: string };

export async function getSetting(key: string): Promise<SettingResult<{ setting: any }>> {
  const setting = await settingRepository.findByKey(key);
  if (!setting) {
    return { ok: false, httpStatus: 404, error: 'Setting not found' };
  }
  return { ok: true, setting };
}

export async function listSettings(type: string | null) {
  return type ? settingRepository.findManyByType(type) : settingRepository.findAll();
}

export async function saveSetting(body: { key?: string; value?: string; type?: string }): Promise<SettingResult<{ setting: any }>> {
  const { key, value, type } = body;
  if (!key || !value || !type) {
    return { ok: false, httpStatus: 400, error: 'Key, value, and type are required' };
  }

  const setting = await settingRepository.upsert(key, value, type);
  return { ok: true, setting };
}

export async function updateSetting(body: { key?: string; value?: string; type?: string }): Promise<SettingResult<{ setting: any }>> {
  const { key, value, type } = body;
  if (!key) {
    return { ok: false, httpStatus: 400, error: 'Key is required' };
  }

  const setting = await settingRepository.update(key, { value, type, updatedAt: new Date() });
  return { ok: true, setting };
}

export async function deleteSetting(key: string | null): Promise<SettingResult<{}>> {
  if (!key) {
    return { ok: false, httpStatus: 400, error: 'Key is required' };
  }

  await settingRepository.delete(key);
  return { ok: true };
}
