'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useCustomerAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.ok) router.push('/account');
    return result;
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return {
    user: session?.user,
    loading,
    isAuthenticated: !!session,
    login,
    logout,
  };
}
