import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { rateLimiters } from '../utils/rateLimit';
import { requireAdminApiSession, requireCustomerSession } from '../middleware/auth';
import { isAdminRole } from '../types/auth.types';
import { passwordResetService } from '../services/auth/passwordReset.service';
import { issueAdminSession, clearAdminSession, readAdminSessionToken } from '../services/auth/adminSession';
import { buildSsoLogoutUrl } from '../services/auth/sso';

const router = Router();

// POST /api/auth/login (customer)
router.post('/login', rateLimiters.login, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.role !== 'customer' && user.role !== 'dealer') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      env.auth.jwtSecret,
      { expiresIn: '30d' }
    );

    res.cookie('customer-token', token, {
      httpOnly: true,
      secure: req.secure,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('customer-token');
  res.json({ success: true });
});

// POST /api/auth/register
router.post('/register', rateLimiters.login, async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash, role: 'customer' },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      env.auth.jwtSecret,
      { expiresIn: '30d' }
    );

    res.cookie('customer-token', token, {
      httpOnly: true,
      secure: req.secure,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireCustomerSession, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.customerSession!.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', rateLimiters.login, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email is required' }); return; }

    const result = await passwordResetService.requestReset(email);
    if (!result.ok) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({ success: true, message: 'If an account exists with this email, you will receive a password reset code.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', rateLimiters.login, async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code, and new password are required' });
      return;
    }

    const result = await passwordResetService.verifyOtpAndReset(email, code, newPassword);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin Auth ──────────────────────────────────────────────────────────

// POST /api/auth/admin-login — issues the same next-auth.session-token
// cookie requireAdminApiSession reads, so apps/admin doesn't need a real
// NextAuth server (no /api/auth/[...nextauth] route exists on that app).
router.post('/admin-login', rateLimiters.login, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive || !isAdminRole(user.role)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    await issueAdminSession(req, res, user);

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/session', requireAdminApiSession, async (req: Request, res: Response) => {
  res.json({ user: req.adminSession!.user });
});

// POST /api/auth/admin/change-password — signed-in staff choose their own
// password (also how a provisioned account clears mustChangePassword).
router.post('/admin/change-password', rateLimiters.login, requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }
    const result = await passwordResetService.changePassword(req.adminSession!.user.id, currentPassword, newPassword);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/admin-logout — mirrors /logout but clears the admin cookie.
router.post('/admin-logout', (req: Request, res: Response) => {
  // A session that came from Kerchanshe SSO also has to end the shared SSO
  // session, or the next "Sign in with SSO" click silently signs straight
  // back in. The browser does that navigation; we only hand it the URL.
  let ssoLogoutUrl: string | undefined;
  const token = readAdminSessionToken(req);
  if (token) {
    const decoded = jwt.decode(token) as { sso?: boolean } | null;
    if (decoded?.sso) ssoLogoutUrl = buildSsoLogoutUrl();
  }

  clearAdminSession(res);
  res.json({ success: true, ...(ssoLogoutUrl ? { ssoLogoutUrl } : {}) });
});

export { router as authRoutes };
