/**
 * News admin service
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

export const newsAdminService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/news${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/news/${id}`),
  create: (data: any) =>
    request<any>(`${BASE}/news`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`${BASE}/news/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  publish: (id: string) =>
    request<any>(`${BASE}/news/${id}/publish`, { method: 'PATCH' }),
  delete: (id: string) => request<void>(`${BASE}/news/${id}`, { method: 'DELETE' }),
};
