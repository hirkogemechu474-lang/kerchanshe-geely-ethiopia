import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { staffSignatureService } from '../services/staffSignature/staffSignature.service';
import { rolePermissionRepository } from '../repositories';

const router = Router();

// All user management routes require admin session
router.use(requireAdminApiSession);

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
    const { name, email, password, role } = req.body;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email: email.toLowerCase(), passwordHash, role } });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
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
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, lastLogin: true, signatureUrl: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id (admin update)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, role, isActive },
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id (admin delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
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
    res.json({ success: true });
  } catch (error) {
    console.error('Send signature link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/admin/role-permissions (get permissions)
// Backed by RolePermissionOverride (one row per role+permissionKey), not a
// single-row-per-role "rolePermission" model.
router.get('/admin/role-permissions', async (req: Request, res: Response) => {
  try {
    const permissions = await rolePermissionRepository.findMany();
    res.json(permissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/admin/role-permissions (update permissions)
router.patch('/admin/role-permissions', async (req: Request, res: Response) => {
  try {
    const { role, permissionKey, value } = req.body;
    const updated = await rolePermissionRepository.upsert(role, permissionKey, value, req.adminSession!.user.id);
    res.json(updated);
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userRoutes };
