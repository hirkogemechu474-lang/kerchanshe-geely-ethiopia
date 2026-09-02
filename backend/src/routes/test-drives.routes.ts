import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/test-drives (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.testDrive.findMany({
        where,
        include: { vehicle: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.testDrive.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List test drives error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/test-drives (admin create)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const testDrive = await prisma.testDrive.create({
      data: { ...req.body, createdById: req.adminSession!.user.id },
    });
    res.status(201).json(testDrive);
  } catch (error) {
    console.error('Create test drive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/test-drives/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const testDrive = await prisma.testDrive.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true },
    });
    if (!testDrive) { res.status(404).json({ error: 'Test drive not found' }); return; }
    res.json(testDrive);
  } catch (error) {
    console.error('Get test drive error:', error);
    res.status(404).json({ error: 'Test drive not found' });
  }
});

// PATCH /api/test-drives/:id (admin update)
router.patch('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const testDrive = await prisma.testDrive.update({ where: { id: req.params.id }, data: req.body });
    res.json(testDrive);
  } catch (error) {
    console.error('Update test drive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as testDriveRoutes };
