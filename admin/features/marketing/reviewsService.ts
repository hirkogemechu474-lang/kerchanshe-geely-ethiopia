/**
 * Reviews moderation service
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

export const reviewsService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/reviews${q}`);
  },
  approve: (id: string) =>
    request<any>(`${BASE}/reviews/${id}/approve`, { method: 'PATCH' }),
  reject: (id: string) =>
    request<any>(`${BASE}/reviews/${id}/reject`, { method: 'PATCH' }),
  delete: (id: string) => request<void>(`${BASE}/reviews/${id}`, { method: 'DELETE' }),
};
