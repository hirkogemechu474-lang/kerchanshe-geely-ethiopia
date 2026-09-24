import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { isAdminRole } from '../types/auth.types';
import { issueAdminSession } from '../services/auth/adminSession';
import {
  isSsoConfigured,
  startFlow,
  exchangeCode,
  verifyIdToken,
  verifyLogoutToken,
  adminHomeUrl,
  adminLoginUrl,
  SsoFlow,
} from '../services/auth/sso';

// Kerchanshe SSO for the staff admin portal (Mode C — an extra way in; the
// password login is untouched). Everything customer-facing, every e-sign /
// secure link and every /api/public route stays outside SSO by design.
//
//   GET  /api/auth/sso/status              { enabled } — drives the login button
//   GET  /api/auth/sso/login               → redirect to the IdP
//   GET  /api/auth/sso/callback            ← IdP redirect; issues the admin session
//   POST /api/auth/sso/backchannel-logout  ← IdP server-to-server sign-out

const router = Router();

// state/nonce/PKCE verifier live in a short-lived signed cookie rather than
// server memory, so an in-flight login survives a backend restart.
const FLOW_COOKIE = 'geely-sso-flow';
const FLOW_TTL_SECONDS = 10 * 60;

router.get('/status', (_req: Request, res: Response) => {
  res.json({ enabled: isSsoConfigured() });
});

router.get('/login', (req: Request, res: Response) => {
  if (!isSsoConfigured()) {
    res.status(404).json({ error: 'SSO is not enabled' });
    return;
  }
  const { flow, authorizeUrl } = startFlow();
  res.cookie(FLOW_COOKIE, jwt.sign(flow, env.auth.nextAuthSecret, { expiresIn: FLOW_TTL_SECONDS }), {
    httpOnly: true,
    secure: req.secure,
    // lax, not strict: the callback is a top-level cross-site redirect back
    // from the IdP, and strict cookies are withheld on exactly that request.
    sameSite: 'lax',
    maxAge: FLOW_TTL_SECONDS * 1000,
    path: '/',
  });
  res.redirect(authorizeUrl);
});

router.get('/callback', async (req: Request, res: Response) => {
  if (!isSsoConfigured()) {
    res.status(404).json({ error: 'SSO is not enabled' });
    return;
  }

  const fail = (code: string) => res.redirect(adminLoginUrl(code));

  // Single-use: clear the flow cookie whatever happens next.
  const flowToken: string | undefined = req.cookies[FLOW_COOKIE];
  res.clearCookie(FLOW_COOKIE, { path: '/', secure: req.secure, sameSite: 'lax' });

  if (typeof req.query.error === 'string') return fail('sso_denied');

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  let flow: SsoFlow;
  try {
    flow = jwt.verify(flowToken ?? '', env.auth.nextAuthSecret) as SsoFlow;
  } catch {
    return fail('sso_expired');
  }
  if (!code || !state || state !== flow.state) return fail('sso_expired');

  try {
    const idToken = await exchangeCode(code, flow.codeVerifier);

    let claims;
    try {
      claims = await verifyIdToken(idToken);
    } catch (err) {
      console.error('SSO id_token verification failed:', err);
      return fail('sso_invalid_token');
    }
    if (claims.nonce !== flow.nonce) return fail('sso_invalid_token');
    if (claims.email_verified !== true || typeof claims.email !== 'string' || typeof claims.sub !== 'string') {
      return fail('sso_email_unverified');
    }

    // No just-in-time provisioning: a staff account's role decides what it
    // can do here, and there is no sensible default role to hand a stranger.
    // An SSO identity only gets in if an admin has already created the
    // matching Geely staff user.
    const user = await prisma.user.findUnique({ where: { email: claims.email.toLowerCase() } });
    if (!user || !isAdminRole(user.role)) return fail('sso_no_account');
    if (!user.isActive) return fail('sso_disabled');

    // Bind the IdP subject on first SSO sign-in (backchannel logout names
    // users by `sub` only). A different `sub` for the same email means the
    // SSO account behind that address changed — don't silently rebind.
    if (user.ssoSubject && user.ssoSubject !== claims.sub) return fail('sso_subject_mismatch');
    if (!user.ssoSubject) {
      const holder = await prisma.user.findUnique({ where: { ssoSubject: claims.sub } });
      if (holder && holder.id !== user.id) return fail('sso_subject_mismatch');
      await prisma.user.update({ where: { id: user.id }, data: { ssoSubject: claims.sub } });
    }

    await issueAdminSession(req, res, user, { sso: true });
    res.redirect(adminHomeUrl());
  } catch (error) {
    console.error('SSO callback error:', error);
    fail('sso_error');
  }
});

router.post('/backchannel-logout', async (req: Request, res: Response) => {
  if (!isSsoConfigured()) {
    res.status(404).json({ error: 'SSO is not enabled' });
    return;
  }
  const logoutToken = typeof req.body?.logout_token === 'string' ? req.body.logout_token : '';
  if (!logoutToken) {
    res.status(400).json({ error: 'logout_token required' });
    return;
  }
  const verified = await verifyLogoutToken(logoutToken);
  if (!verified) {
    res.status(400).json({ error: 'invalid logout token' });
    return;
  }

  if (verified.sub) {
    // Cutoff, not a session delete: every admin session token issued before
    // now is rejected by requireAdminApiSession on its next request —
    // including password-login sessions on other devices, which is what an
    // IdP "sign out everywhere" / account disable should mean.
    await prisma.user.updateMany({
      where: { ssoSubject: verified.sub },
      data: { sessionsRevokedAt: new Date() },
    });
  }

  // Same response whether or not the subject is known here.
  res.json({ ok: true });
});

export { router as ssoRoutes };
