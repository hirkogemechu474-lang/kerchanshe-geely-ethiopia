/**
 * Spare parts admin service
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

export const partsAdminService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/parts${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/parts/${id}`),
  create: (data: any) =>
    request<any>(`${BASE}/parts`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`${BASE}/parts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStock: (id: string, stock: number) =>
    request<any>(`${BASE}/parts/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    }),
  delete: (id: string) => request<void>(`${BASE}/parts/${id}`, { method: 'DELETE' }),
};
