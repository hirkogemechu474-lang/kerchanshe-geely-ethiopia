import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { staffSignatureService } from '../services/staffSignature/staffSignature.service';

const router = Router();

// All user management routes require admin session
router.use(requireAdminApiSession);

// Mirrors ROLE_OPTIONS in apps/admin/lib/auth/types.ts. Kept as a plain list
// (rather than importing that file) because backend has no shared module
// path into the admin app — update both places together if a role is added.
const VALID_STAFF_ROLES = [
  'super_admin', 'admin', 'manager', 'sales', 'service', 'marketing',
  'service_advisor', 'service_manager', 'gm_geely', 'sales_manager',
  'after_sales_manager', 'sales_representative', 'workshop_manager', 'viewer',
];

// Full shape NewUserForm/EditUserForm/RolesPermissionsManager read from —
// used by every handler below so create/get/update always agree on what a
// "user" looks like over the wire.
const USER_DETAIL_SELECT = {
  id: true, name: true, email: true, role: true, isActive: true,
  dealerId: true, createdAt: true, lastLogin: true, signatureUrl: true,
  isAvailableForLeads: true, leadHoursStart: true, leadHoursEnd: true,
  brandSpecializations: { select: { brandId: true } },
} as const;

// GET /api/admin/users (admin list)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, lastLogin: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users (admin create)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, dealerId, isActive } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required.' });
      return;
    }
    if (!VALID_STAFF_ROLES.includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        dealerId: dealerId || null,
        isActive: isActive ?? true,
      },
      select: USER_DETAIL_SELECT,
    });
    res.status(201).json({ user });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(400).json({ error: 'A user with that email already exists.' });
      return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/signatures (staff signatures list)
// Registered before '/:id' below — Express matches routes in registration
// order, and '/:id' would otherwise swallow this request as id === 'signatures'.
router.get('/signatures', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        signatureUrl: true,
        signatureUpdatedAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Get staff signatures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/:id (admin detail)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: USER_DETAIL_SELECT,
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id (admin update)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, role, isActive, dealerId, isAvailableForLeads, leadHoursStart, leadHoursEnd, brandIds } = req.body;

    if (role !== undefined && !VALID_STAFF_ROLES.includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = String(email).toLowerCase();
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (dealerId !== undefined) data.dealerId = dealerId || null;
    if (isAvailableForLeads !== undefined) data.isAvailableForLeads = isAvailableForLeads;
    if (leadHoursStart !== undefined) data.leadHoursStart = leadHoursStart === null ? null : Number(leadHoursStart);
    if (leadHoursEnd !== undefined) data.leadHoursEnd = leadHoursEnd === null ? null : Number(leadHoursEnd);
    if (Array.isArray(brandIds)) {
      data.brandSpecializations = {
        deleteMany: {},
        create: brandIds.map((brandId: string) => ({ brandId })),
      };
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: USER_DETAIL_SELECT,
    });
    res.json({ user });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (error?.code === 'P2002') {
      res.status(400).json({ error: 'A user with that email already exists.' });
      return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id (admin deactivate — soft delete, reversible
// via PUT isActive:true, since other records may reference this user)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:id/signature-link (send signature link)
// User.signatureSetupToken/ExpiresAt hold this token (see schema.prisma) —
// there is no separate SignatureToken model. staffSignatureService already
// generates + stores the token and emails the setup link.
router.post('/:id/signature-link', async (req: Request, res: Response) => {
  try {
    const result = await staffSignatureService.initiateSetup(req.params.id);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json({ success: true, notificationSent: result.data?.notificationSent, notificationError: result.data?.notificationError });
  } catch (error) {
    console.error('Send signature link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Role-permissions handlers used to live here (GET/PATCH '/admin/role-permissions'),
// but since this router is mounted at /admin/users that resolved to the
// double-nested /api/admin/users/admin/role-permissions. Relocated to
// role-permissions.routes.ts, mounted directly at /admin/role-permissions.

export { router as userRoutes };
