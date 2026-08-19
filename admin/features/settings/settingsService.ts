/**
 * Site settings admin service
 */

const BASE = '/api/admin';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const settingsService = {
  business: {
    get: () => request<any>(`${BASE}/settings/business`),
    update: (data: any) =>
      request<any>(`${BASE}/settings/business`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  contact: {
    get: () => request<any>(`${BASE}/settings/contact`),
    update: (data: any) =>
      request<any>(`${BASE}/settings/contact`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  social: {
    get: () => request<any>(`${BASE}/settings/social`),
    update: (data: any) =>
      request<any>(`${BASE}/settings/social`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  integrations: {
    get: () => request<any>(`${BASE}/settings/integrations`),
    update: (data: any) =>
      request<any>(`${BASE}/settings/integrations`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
