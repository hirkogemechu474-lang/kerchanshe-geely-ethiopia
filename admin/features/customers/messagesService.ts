/**
 * Customer messages/contact form management
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

export const messagesService = {
  list: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return request<any[]>(`${BASE}/messages${q}`);
  },
  get: (id: string) => request<any>(`${BASE}/messages/${id}`),
  markAsRead: (id: string) =>
    request<any>(`${BASE}/messages/${id}/read`, { method: 'PATCH' }),
  reply: (id: string, replyText: string) =>
    request<any>(`${BASE}/messages/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply: replyText }),
    }),
  delete: (id: string) => request<void>(`${BASE}/messages/${id}`, { method: 'DELETE' }),
};
