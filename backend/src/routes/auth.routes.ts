import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { rateLimiters } from '../utils/rateLimit';
import { requireAdminApiSession, requireCustomerSession } from '../middleware/auth';
import { isAdminRole } from '../types/auth.types';
import { passwordResetService } from '../services/auth/passwordReset.service';

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
      secure: env.nodeEnv === 'production',
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
      secure: env.nodeEnv === 'production',
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

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    // requireAdminApiSession only reads `decoded.email` off this token, but
    // the full profile keeps the payload consistent with what a real
    // NextAuth JWT would have carried.
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      env.auth.nextAuthSecret,
      { expiresIn: '30d' }
    );

    const secure = env.nodeEnv === 'production';
    const cookieName = secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/session', requireAdminApiSession, async (req: Request, res: Response) => {
  res.json({ user: req.adminSession!.user });
});

// POST /api/auth/admin-logout — mirrors /logout but clears the admin cookie.
router.post('/admin-logout', (_req: Request, res: Response) => {
  res.clearCookie('next-auth.session-token');
  res.clearCookie('__Secure-next-auth.session-token');
  res.json({ success: true });
});

export { router as authRoutes };
