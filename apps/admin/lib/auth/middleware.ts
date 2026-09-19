import { redirect } from 'next/navigation';
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { AdminRole, AdminPermissions, AdminSession as SharedAdminSession } from './types';
import { ROLE_PERMISSIONS } from './types';
import { serverApiClient } from '@/lib/serverApiClient';

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
  expires: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    permissions: AdminPermissions;
    expires: string;
  };
}

// Cached per-request (React's cache()) so every requirePermission()/getSession()
// call within a single render shares one round-trip to the backend, same as
// the original NextAuth-based version this replaced.
export const getSession = cache(async (): Promise<AdminSession | null> => {
  try {
    const cookieStore = await cookies();
    const hasCookie =
      cookieStore.get('next-auth.session-token') || cookieStore.get('__Secure-next-auth.session-token');
    if (!hasCookie) return null;

    const client = await serverApiClient();
    const { data } = await client.post('/auth/admin/session');
    const user = data?.user;
    if (!user) return null;

    // The backend already computes effective permissions (role defaults +
    // any RolePermissionOverride rows) via getEffectivePermissions() and
    // includes them on user.permissions — use that directly so DB overrides
    // made in the Roles & Permissions UI are reflected here immediately.
    // Fall back to the static table only if the backend ever omits it.
    const permissions: AdminPermissions =
      user.permissions ?? ROLE_PERMISSIONS[user.role as AdminRole] ?? ({} as AdminPermissions);

    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
      expires,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions, expires },
    };
  } catch {
    return null;
  }
});

export async function requireAuth(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function requirePermission(permission: string): Promise<AdminSession> {
  const session = await requireAuth();
  if (!session.permissions[permission as keyof AdminPermissions]) {
    redirect('/admin/unauthorized');
  }
  return session;
}

export function withAuth(handler: any) {
  return handler;
}
