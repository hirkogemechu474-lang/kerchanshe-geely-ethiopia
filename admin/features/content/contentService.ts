/**
 * Content management service
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

export const contentService = {
  hero: {
    get: () => request<any>(`${BASE}/content/hero`),
    update: (data: any) =>
      request<any>(`${BASE}/content/hero`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  showcase: {
    list: () => request<any[]>(`${BASE}/content/showcase`),
    create: (data: any) =>
      request<any>(`${BASE}/content/showcase`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`${BASE}/content/showcase/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`${BASE}/content/showcase/${id}`, { method: 'DELETE' }),
  },
  pages: {
    list: () => request<any[]>(`${BASE}/content/pages`),
    get: (slug: string) => request<any>(`${BASE}/content/pages/${slug}`),
    update: (slug: string, data: any) =>
      request<any>(`${BASE}/content/pages/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
