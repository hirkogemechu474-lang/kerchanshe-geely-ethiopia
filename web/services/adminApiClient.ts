/**
 * Admin API Client for Web
 * 
 * Web app connects to Admin backend API instead of direct database access.
 * Admin runs on port 3001 and owns Prisma/DB.
 * 
 * Environment: Set NEXT_PUBLIC_ADMIN_API_URL in web/.env
 * Default: http://localhost:3001
 */

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${ADMIN_API_URL}${endpoint}`;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Public API Endpoints ─────────────────────────────────────────────────────

export const adminApi = {
  // Vehicles
  vehicles: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiRequest<{ vehicles: any[]; total?: number }>(`/api/public/vehicles${query}`);
    },
    getBySlug: (slug: string) =>
      apiRequest<any>(`/api/public/vehicles/${slug}`),
    getById: (id: string) =>
      apiRequest<any>(`/api/public/vehicles/${id}`),
  },

  // Dealers
  dealers: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiRequest<any[]>(`/api/public/dealers${query}`);
    },
    getById: (id: string) =>
      apiRequest<any>(`/api/public/dealers/${id}`),
  },

  // News
  news: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiRequest<any[]>(`/api/public/news${query}`);
    },
    getBySlug: (slug: string) =>
      apiRequest<any>(`/api/public/news/${slug}`),

  },

  // Services Menu
  services: {
    getMenu: () =>
      apiRequest<{ sections: any[] }>('/api/public/services/menu'),
  },

  // Electric Menu
  electric: {
    getMenu: () =>
      apiRequest<{ sections: any[] }>('/api/public/electric/menu'),
  },

  // Test Drive Requests
  testDrive: {
    submit: (data: any) =>
      apiRequest<{ success: boolean; id: string }>('/api/public/test-drive', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Quote Requests
  quote: {
    submit: (data: any) =>
      apiRequest<{ success: boolean; id: string }>('/api/public/quote', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Contact/Messages
  contact: {
    submit: (data: any) =>
      apiRequest<{ success: boolean; id: string }>('/api/public/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Settings
  settings: {
    getBusiness: () =>
      apiRequest<any>('/api/public/settings/business'),
    getContact: () =>
      apiRequest<any>('/api/public/settings/contact'),
    getSocial: () =>
      apiRequest<any>('/api/public/settings/social'),
  },
};

// ─── Client-side hook wrapper ─────────────────────────────────────────────────

export function useAdminApi() {
  return adminApi;
}

// ─── Server-side exports ──────────────────────────────────────────────────────

export { apiRequest, ADMIN_API_URL };
