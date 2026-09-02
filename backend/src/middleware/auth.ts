import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import { prisma } from '../config/database';
import { isAdminRole, isPublicRole, AdminRole, AdminPermissions } from '../types/auth.types';
import { ROLE_PERMISSIONS } from './rolePermissions';
import { env } from '../config/env';

// ── Extend Express Request ──────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      adminSession?: {
        user: {
          id: string;
          email: string;
          name: string;
          role: AdminRole;
          permissions: AdminPermissions;
          dealerId?: string;
        };
      };
      customerSession?: {
        id: string;
        name: string;
        email: string;
        role: 'customer' | 'dealer';
      };
    }
  }
}

// ── Admin Session (NextAuth JWT verification) ───────────────────────────
export async function requireAdminApiSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // NextAuth stores session in encrypted JWT cookie
    const sessionToken = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'];

    if (!sessionToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify the NextAuth session JWT
    const decoded = verify(sessionToken, env.auth.nextAuthSecret) as JwtPayload;

    if (!decoded?.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user || !user.isActive || !isAdminRole(user.role)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Build permissions (hardcoded defaults + DB overrides)
    const permissions = await getEffectivePermissions(user.role as AdminRole);

    req.adminSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as AdminRole,
        permissions,
        dealerId: user.dealerId ?? undefined,
      },
    };

    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ── Permission Checker ──────────────────────────────────────────────────
export function requirePermission(permission: keyof AdminPermissions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminSession?.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.adminSession.user.permissions[permission]) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
}

// ── Customer Session (JWT cookie) ──────────────────────────────────────
export async function requireCustomerSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies['customer-token'];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const secret = env.auth.jwtSecret;
    const payload = verify(token, secret) as JwtPayload;

    if (!payload?.id || !payload?.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!isPublicRole(payload.role)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.customerSession = {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'customer' | 'dealer',
    };

    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ── Optional Customer Session (doesn't reject unauthenticated) ──────────
export async function optionalCustomerSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies['customer-token'];
    if (!token) { next(); return; }

    const secret = env.auth.jwtSecret;
    const payload = verify(token, secret) as JwtPayload;

    if (payload?.id && payload?.email && isPublicRole(payload.role)) {
      req.customerSession = {
        id: payload.id as string,
        name: payload.name as string,
        email: payload.email as string,
        role: payload.role as 'customer' | 'dealer',
      };
    }
  } catch {
    // Ignore invalid tokens
  }
  next();
}

// ── Effective Permissions (hardcoded + DB overrides) ────────────────────
async function getEffectivePermissions(role: AdminRole): Promise<AdminPermissions> {
  const defaults = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[AdminRole.CUSTOMER];

  const overrides = await prisma.rolePermissionOverride.findMany({
    where: { role },
  });

  if (overrides.length === 0) return defaults;

  const permissions = { ...defaults };
  for (const override of overrides) {
    (permissions as any)[override.permissionKey] = override.value;
  }

  return permissions;
}
