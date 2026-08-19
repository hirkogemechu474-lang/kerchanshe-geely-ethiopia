import { cookies } from 'next/headers';
import { verify, JwtPayload } from 'jsonwebtoken';
import { cache } from 'react';

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'dealer';
}

/**
 * Read and verify the customer-token JWT set by /api/auth/login.
 * Cached per request so multiple calls within one render are free.
 * Returns null when the user is not signed in or the token is invalid/expired.
 */
export const getCustomerSession = cache(async (): Promise<CustomerSession | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer-token')?.value;

    if (!token) return null;

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
    const payload = verify(token, secret) as JwtPayload;

    if (!payload?.id || !payload?.email) return null;

    // Reject admin roles — they must use the admin panel
    if (payload.role !== 'customer' && payload.role !== 'dealer') return null;

    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'customer' | 'dealer',
    };
  } catch {
    // Token expired, tampered, or missing
    return null;
  }
});
