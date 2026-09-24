import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

export const ADMIN_SESSION_COOKIE = 'next-auth.session-token';
export const ADMIN_SESSION_COOKIE_SECURE = '__Secure-next-auth.session-token';

const ADMIN_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Issues the next-auth.session-token cookie requireAdminApiSession reads.
 * The one place an admin session is minted — both the password login and
 * the Kerchanshe SSO callback call this, so an SSO sign-in is
 * indistinguishable from a password sign-in to every other part of the app.
 *
 * `sso: true` is carried in the token only so logout knows to also end the
 * shared SSO session at the IdP.
 */
export async function issueAdminSession(
  req: Request,
  res: Response,
  user: AdminSessionUser,
  opts: { sso?: boolean } = {},
): Promise<void> {
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  // requireAdminApiSession only reads `decoded.email` (and `iat`) off this
  // token, but the full profile keeps the payload consistent with what a
  // real NextAuth JWT would have carried.
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, ...(opts.sso ? { sso: true } : {}) },
    env.auth.nextAuthSecret,
    { expiresIn: '30d' }
  );

  const secure = req.secure;
  res.cookie(secure ? ADMIN_SESSION_COOKIE_SECURE : ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE_MS,
  });
}

export function clearAdminSession(res: Response): void {
  // The __Secure- prefix requires the Secure attribute on EVERY Set-Cookie
  // for that name, including this clearing one, or browsers reject the
  // instruction outright and the session cookie is never actually removed
  // — logout silently no-ops while still returning { success: true }.
  res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
  res.clearCookie(ADMIN_SESSION_COOKIE_SECURE, { path: '/', secure: true, sameSite: 'lax' });
}

export function readAdminSessionToken(req: Request): string | undefined {
  return req.cookies[ADMIN_SESSION_COOKIE] || req.cookies[ADMIN_SESSION_COOKIE_SECURE];
}
