'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { BASE_PATH } from '@/lib/basePath';

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  // Passing the server-fetched session avoids the client doing an extra
  // /api/auth/session fetch, which would cause a loading flash and trigger
  // the `if (!session) return null` guard in AdminLayout prematurely.
  return (
    <NextAuthSessionProvider
      session={session}
      basePath={BASE_PATH ? `${BASE_PATH}/api/auth` : undefined}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
