'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSessionContext } from '@/components/admin/SessionProvider';

/**
 * Hook to protect admin client pages.
 * Redirects to /admin/login if unauthenticated or permission missing.
 */
export function useAdminAuth(requiredPermission?: string) {
  const session = useAdminSessionContext();
  const router = useRouter();
  // The session is seeded server-side (app/admin/layout.tsx) before any
  // client component renders, so there is no separate loading phase here.
  const loading = false;

  useEffect(() => {
    if (!session) {
      router.push('/admin/login');
      return;
    }

    if (requiredPermission && session.user?.permissions) {
      const hasPermission =
        session.user.permissions[requiredPermission as keyof typeof session.user.permissions];
      if (!hasPermission) {
        router.push('/admin/analytics');
      }
    }
  }, [session, loading, requiredPermission, router]);

  return { user: session?.user, loading, session };
}
