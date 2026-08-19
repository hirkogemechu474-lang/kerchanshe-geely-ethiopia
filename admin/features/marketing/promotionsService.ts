/**
 * Promotions admin service
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

export const promotionsService = {
  list: () => request<any[]>(`${BASE}/promotions`),
  get: (id: string) => request<any>(`${BASE}/promotions/${id}`),
  create: (data: any) =>
    request<any>(`${BASE}/promotions`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`${BASE}/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`${BASE}/promotions/${id}`, { method: 'DELETE' }),
};
