/**
 * Admin dealer service — CRUD operations via admin API routes
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

export const dealerAdminService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ dealers: any[]; total: number }>(`${BASE}/dealers${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/dealers/${id}`),
  create: (data: any) =>
    request<any>(`${BASE}/dealers`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`${BASE}/dealers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`${BASE}/dealers/${id}`, { method: 'DELETE' }),
};
