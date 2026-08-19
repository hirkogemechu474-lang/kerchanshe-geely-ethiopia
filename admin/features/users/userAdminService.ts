/**
 * User admin service
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

export const userAdminService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/users${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/users/${id}`),
  create: (data: any) =>
    request<any>(`${BASE}/users`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`${BASE}/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateRole: (id: string, role: string) =>
    request<any>(`${BASE}/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  toggleStatus: (id: string) =>
    request<any>(`${BASE}/users/${id}/status`, { method: 'PATCH' }),
  delete: (id: string) => request<void>(`${BASE}/users/${id}`, { method: 'DELETE' }),
};
