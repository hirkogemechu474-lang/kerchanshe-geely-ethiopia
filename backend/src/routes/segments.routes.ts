import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { segmentationService } from '../services/marketing/segmentation.service';

const router = Router();

// Staff-only marketing tool — reuses the existing Promotions permission
// rather than adding a new one, same gate as /admin/promotions.
const guard = [requireAdminApiSession, requirePermission('canManagePromotions')];

// GET /api/segments (list)
router.get('/', guard, async (req: Request, res: Response) => {
  const result = await segmentationService.list();
  if (!result.ok) { res.status(500).json({ error: result.error }); return; }
  res.json({ items: result.data });
});

// POST /api/segments (create)
router.post('/', guard, async (req: Request, res: Response) => {
  const result = await segmentationService.create(req.body, req.adminSession!.user.id);
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  res.status(201).json(result.data);
});

// POST /api/segments/preview (ad-hoc criteria, used by the create/edit form's live preview)
router.post('/preview', guard, async (req: Request, res: Response) => {
  const result = await segmentationService.preview(req.body?.criteria || {});
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  res.json(result.data);
});

// GET /api/segments/meta/vehicle-models (registered before /:id so it isn't
// swallowed by the param route)
router.get('/meta/vehicle-models', guard, async (req: Request, res: Response) => {
  const result = await segmentationService.listOwnedVehicleModels();
  if (!result.ok) { res.status(500).json({ error: result.error }); return; }
  res.json({ models: result.data });
});

// GET /api/segments/:id
router.get('/:id', guard, async (req: Request, res: Response) => {
  const result = await segmentationService.getById(req.params.id);
  if (!result.ok) { res.status(404).json({ error: result.error }); return; }
  res.json(result.data);
});

// PUT /api/segments/:id
router.put('/:id', guard, async (req: Request, res: Response) => {
  const result = await segmentationService.update(req.params.id, req.body);
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  res.json(result.data);
});

// DELETE /api/segments/:id
router.delete('/:id', guard, async (req: Request, res: Response) => {
  const result = await segmentationService.delete(req.params.id);
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  res.json({ success: true });
});

// POST /api/segments/:id/send — manual campaign send to this segment's
// currently-matching customers (re-resolved at send time, not cached).
router.post('/:id/send', guard, async (req: Request, res: Response) => {
  const segment = await segmentationService.getById(req.params.id);
  if (!segment.ok) { res.status(404).json({ error: segment.error }); return; }

  const { subject, message, ctaLabel, ctaUrl } = req.body ?? {};
  const result = await segmentationService.sendCampaign({
    criteria: (segment.data!.criteria as any) || {},
    subject,
    message,
    ctaLabel,
    ctaUrl,
  });
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  res.json(result.data);
});

export { router as segmentRoutes };
