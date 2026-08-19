/**
 * Service bookings management
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

export const serviceBookingService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/service-bookings${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/service-bookings/${id}`),
  updateStatus: (id: string, status: string) =>
    request<any>(`${BASE}/service-bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    request<void>(`${BASE}/service-bookings/${id}`, { method: 'DELETE' }),
};
