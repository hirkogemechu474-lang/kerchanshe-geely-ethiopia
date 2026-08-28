import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { userRepository } from '@/repositories/userRepository';
import { isPublicRole } from '@/lib/auth/types';

export type LoginResult =
  | { ok: true; user: { id: string; name: string; email: string; role: string }; token: string }
  | { ok: false; httpStatus: 401 | 403; error: string };

export async function loginCustomer(email: string, password: string): Promise<LoginResult> {
  const user = await userRepository.findByEmail(email.toLowerCase());

  if (!user || !user.isActive) {
    return { ok: false, httpStatus: 401, error: 'Invalid email or password' };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { ok: false, httpStatus: 401, error: 'Invalid email or password' };
  }

  // Only customer/dealer accounts may use this endpoint — every staff role
  // belongs on the admin login instead. An allowlist here is safer than a
  // hardcoded staff blocklist, which previously named only 3 of the 8
  // staff roles and let the rest (sales, service, marketing, service
  // advisor/manager) slip through onto the public portal.
  if (!isPublicRole(user.role)) {
    return { ok: false, httpStatus: 403, error: 'Please use the admin login page' };
  }

  await userRepository.updateLastLogin(user.id);

  // Issue a simple JWT for the public portal
  const token = sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!,
    { expiresIn: '7d' }
  );

  return { ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
}
