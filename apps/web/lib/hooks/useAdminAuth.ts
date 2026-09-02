'use client';

export function useAdminAuth() {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: async (email: string, password: string) => {},
    logout: async () => {},
  };
}
