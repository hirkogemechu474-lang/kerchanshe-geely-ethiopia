/**
 * Quote requests management
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

export const quoteService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/quotations${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/quotations/${id}`),
  updateStatus: (id: string, status: string) =>
    request<any>(`${BASE}/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  sendQuote: (id: string, quoteData: any) =>
    request<any>(`${BASE}/quotations/${id}/send`, {
      method: 'POST',
      body: JSON.stringify(quoteData),
    }),
  delete: (id: string) => request<void>(`${BASE}/quotations/${id}`, { method: 'DELETE' }),
};
