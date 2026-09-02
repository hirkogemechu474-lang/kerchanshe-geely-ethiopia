import { getSession } from '@/lib/auth/middleware';
import AdminLayout from '@/components/admin/AdminLayout';
import SessionProvider from '@/components/admin/SessionProvider';

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // getSession() is cached with React cache() — so this call and any
  // requireAuth()/requirePermission() calls inside child page components
  // all share the same result within a single request, with only one
  // round-trip to NextAuth/DB.
  const session = await getSession();

  const initialUser = session?.user
    ? {
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: session.user.role ?? 'admin',
        permissions: session.user.permissions,
      }
    : null;

  return (
    <SessionProvider session={session}>
      {session ? (
        <AdminLayout initialUser={initialUser}>{children}</AdminLayout>
      ) : (
        children
      )}
    </SessionProvider>
  );
}
