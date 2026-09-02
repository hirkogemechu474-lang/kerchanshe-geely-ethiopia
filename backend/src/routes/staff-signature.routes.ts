import { Router, Request, Response } from 'express';
import { rateLimiters } from '../utils/rateLimit';
import { staffSignatureRepository } from '../repositories';
import { staffSignatureService } from '../services/staffSignature/staffSignature.service';

const router = Router();

// GET /api/staff-signature/:token (lookup token)
// The token lives on User.signatureSetupToken (see schema.prisma) rather
// than a separate token table — there is no SignatureToken model.
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const user = await staffSignatureRepository.findByToken(req.params.token);
    if (!user) { res.status(404).json({ error: 'Invalid token' }); return; }
    if (user.signatureSetupTokenExpiresAt && user.signatureSetupTokenExpiresAt < new Date()) {
      res.status(400).json({ error: 'Token expired' });
      return;
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Lookup signature token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/staff-signature/:token/sign (complete setup)
router.post('/:token/sign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { signatureData } = req.body;
    const result = await staffSignatureService.completeSetup(req.params.token, signatureData);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Complete signature setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as staffSignatureRoutes };
