'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Hook to protect admin client pages.
 * Redirects to /admin/login if unauthenticated or permission missing.
 */
export function useAdminAuth(requiredPermission?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';

  useEffect(() => {
    if (!loading) {
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
    }
  }, [session, loading, requiredPermission, router]);

  return { user: session?.user, loading, session };
}
