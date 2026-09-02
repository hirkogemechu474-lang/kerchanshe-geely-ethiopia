import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// ── Programs ─────────────────────────────────────────────────────────────

// GET /api/financing/programs (admin list)
router.get('/programs', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const programs = await prisma.financingProgram.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(programs);
  } catch (error) {
    console.error('List financing programs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/financing/programs (admin create)
router.post('/programs', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const program = await prisma.financingProgram.create({ data: req.body });
    res.status(201).json(program);
  } catch (error) {
    console.error('Create financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/financing/programs/:id (admin detail)
router.get('/programs/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const program = await prisma.financingProgram.findUnique({ where: { id: req.params.id } });
    if (!program) { res.status(404).json({ error: 'Program not found' }); return; }
    res.json(program);
  } catch (error) {
    console.error('Get financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/financing/programs/:id (admin update)
router.put('/programs/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const program = await prisma.financingProgram.update({ where: { id: req.params.id }, data: req.body });
    res.json(program);
  } catch (error) {
    console.error('Update financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/financing/programs/:id (admin delete)
router.delete('/programs/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.financingProgram.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Banks ────────────────────────────────────────────────────────────────

// GET /api/financing/banks (admin list)
router.get('/banks', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const banks = await prisma.bank.findMany({ orderBy: { name: 'asc' } });
    res.json(banks);
  } catch (error) {
    console.error('List banks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/financing/banks (admin create)
router.post('/banks', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const bank = await prisma.bank.create({ data: req.body });
    res.status(201).json(bank);
  } catch (error) {
    console.error('Create bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/financing/banks/:id (admin detail)
router.get('/banks/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const bank = await prisma.bank.findUnique({ where: { id: req.params.id } });
    if (!bank) { res.status(404).json({ error: 'Bank not found' }); return; }
    res.json(bank);
  } catch (error) {
    console.error('Get bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/financing/banks/:id (admin update)
router.put('/banks/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const bank = await prisma.bank.update({ where: { id: req.params.id }, data: req.body });
    res.json(bank);
  } catch (error) {
    console.error('Update bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/financing/banks/:id (admin delete)
router.delete('/banks/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.bank.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as financingRoutes };
