/**
 * Test drive requests management
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

export const testDriveService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/test-drives${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/test-drives/${id}`),
  updateStatus: (id: string, status: string) =>
    request<any>(`${BASE}/test-drives/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) => request<void>(`${BASE}/test-drives/${id}`, { method: 'DELETE' }),
};
