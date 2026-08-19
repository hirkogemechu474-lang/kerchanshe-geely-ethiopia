import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { isAdminRole } from './types';

type AdminSession = Awaited<ReturnType<typeof getServerSession>>;

/**
 * Guard for admin API route handlers.
 *
 * Returns `{ session, response }`. When the caller is not an authenticated
 * admin, `response` is a 401 JSON response and `session` is null. Route
 * handlers must short-circuit on a non-null `response`:
 *
 *   const { session, response } = await requireAdminApiSession();
 *   if (response) return response;
 *
 * This is the single server-side enforcement point for /api/admin/* routes.
 * Client-side checks are never sufficient on their own.
 */
export async function requireAdminApiSession(): Promise<{
  session: AdminSession;
  response: NextResponse | null;
}> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isAdminRole(session.user.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { session, response: null };
}
