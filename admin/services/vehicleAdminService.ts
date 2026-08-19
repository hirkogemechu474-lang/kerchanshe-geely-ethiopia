/**
 * Admin vehicle service — CRUD operations via the admin API routes.
 * Used in client components that need to call the API.
 */

const BASE = '/api/admin';

export interface CreateVehiclePayload {
  name: string;
  slug: string;
  model: string;
  year: number;
  categoryId: string;
  basePrice: number;
  description?: string;
  isFeatured?: boolean;
}

export interface UpdateVehiclePayload extends Partial<CreateVehiclePayload> {
  isActive?: boolean;
  status?: string;
  displayOrder?: number;
}

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

export const vehicleAdminService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ vehicles: unknown[]; total: number }>(`${BASE}/vehicles${q}`);
  },
  get:    (id: string)                          => request<unknown>(`${BASE}/vehicles/${id}`),
  create: (data: CreateVehiclePayload)          => request<unknown>(`${BASE}/vehicles`, { method: 'POST',  body: JSON.stringify(data) }),
  update: (id: string, data: UpdateVehiclePayload) => request<unknown>(`${BASE}/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string)                          => request<void>(`${BASE}/vehicles/${id}`, { method: 'DELETE' }),
};
