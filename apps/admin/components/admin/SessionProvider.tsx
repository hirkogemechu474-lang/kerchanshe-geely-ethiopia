'use client';

import { createContext, useContext } from 'react';
import apiClient from '@/lib/apiClient';
import type { AdminSession } from '@/lib/auth/middleware';

// Replaces next-auth/react's SessionProvider/useSession/signOut. There is no
// real NextAuth server on this app (no app/api/auth route) — the backend
// issues and reads the next-auth.session-token cookie directly (see
// backend/src/routes/auth.routes.ts POST /auth/admin-login). This context
// just carries the server-fetched session (see app/admin/layout.tsx) down
// to client components, avoiding any client-side session re-fetch/flash.
const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSessionContext() {
  return useContext(AdminSessionContext);
}

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: AdminSession | null;
}) {
  return (
    <AdminSessionContext.Provider value={session ?? null}>{children}</AdminSessionContext.Provider>
  );
}

export async function signOut({ callbackUrl = '/admin/login' }: { callbackUrl?: string } = {}) {
  try {
    await apiClient.post('/auth/admin-logout');
  } finally {
    window.location.href = callbackUrl;
  }
}
