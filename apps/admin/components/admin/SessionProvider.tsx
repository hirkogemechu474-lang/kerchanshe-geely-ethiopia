'use client';

import { createContext, useContext } from 'react';
import apiClient from '@/lib/apiClient';
import type { AdminSession } from '@/lib/auth/middleware';
import { withBasePath } from '@/lib/basePath';

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
  let ssoLogoutUrl: string | undefined;
  try {
    const res = await apiClient.post('/auth/admin-logout');
    ssoLogoutUrl = res.data?.ssoLogoutUrl;
  } finally {
    // A Kerchanshe SSO session also has to be ended at the IdP, or the next
    // "Sign in with SSO" click signs straight back in without a prompt. The
    // IdP sends the browser back to the login page afterwards.
    if (ssoLogoutUrl) {
      window.location.href = ssoLogoutUrl;
      return;
    }
    // window.location.href is a real navigation, not a fetch() call — the
    // basePath-aware fetch patch in layout.tsx doesn't touch it. A bare
    // "/admin/login" here lands outside "/geely" entirely (this vhost's
    // bare-domain default, not the login page), which looks exactly like
    // "logout doesn't work" since the user never actually reaches login.
    window.location.href = withBasePath(callbackUrl);
  }
}
