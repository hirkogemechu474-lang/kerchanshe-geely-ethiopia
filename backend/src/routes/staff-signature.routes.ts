import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/staff-signature/:token (lookup token)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const tokenRecord = await prisma.signatureToken.findUnique({
      where: { token: req.params.token },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!tokenRecord) { res.status(404).json({ error: 'Invalid token' }); return; }
    if (tokenRecord.usedAt) { res.status(400).json({ error: 'Token already used' }); return; }
    if (tokenRecord.expiresAt < new Date()) { res.status(400).json({ error: 'Token expired' }); return; }
    res.json({ user: tokenRecord.user });
  } catch (error) {
    console.error('Lookup signature token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/staff-signature/:token/sign (complete setup)
router.post('/:token/sign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const tokenRecord = await prisma.signatureToken.findUnique({ where: { token: req.params.token } });
    if (!tokenRecord) { res.status(404).json({ error: 'Invalid token' }); return; }
    if (tokenRecord.usedAt) { res.status(400).json({ error: 'Token already used' }); return; }
    if (tokenRecord.expiresAt < new Date()) { res.status(400).json({ error: 'Token expired' }); return; }

    const { signatureData, password } = req.body;

    // Update user's signature
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { signatureData },
    });

    // Mark token as used
    await prisma.signatureToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Complete signature setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as staffSignatureRoutes };
