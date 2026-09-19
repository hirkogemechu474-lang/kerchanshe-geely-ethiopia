import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { warrantyService } from '../services/warranty/warranty.service';

const router = Router();

// Every route here only ever required a valid admin session. This is the
// "Warranty Register" module (service history/reminders tied to job
// cards) — a different feature from workshop.routes.ts's warranty-claims
// endpoints (defect/complaint claims, already gated on
// canManageWarrantyClaims). AdminLayout.tsx's nav labels this
// canManageWarrantyClaims too, but the page that actually consumes this
// router (apps/admin/app/admin/warranty/page.tsx) guards with
// requirePermission('canViewJobCards') instead, and canManageWarrantyClaims
// is otherwise only used by the separate workshop/warranty-claims pages.
// Matching the real page guard (and using canManageJobCards — already used
// elsewhere for job-card mutations — for the mutating routes) avoids 403ing
// roles like Service Advisor, which has canViewJobCards/canManageJobCards
// but not canManageWarrantyClaims.
const viewGate = requirePermission('canViewJobCards');
const manageGate = requirePermission('canManageJobCards');

// GET /api/warranty/upcoming-services - Get warranties with upcoming services
router.get('/upcoming-services', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30;
    const result = await warrantyService.getUpcomingServices(daysAhead);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get upcoming services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/warranty/send-reminders - Send service reminders
router.post('/send-reminders', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const result = await warrantyService.sendServiceReminders();
    res.json(result);
  } catch (error) {
    console.error('Send service reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/warranty/:orderId - Get warranty by order ID
router.get('/:orderId', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const result = await warrantyService.getWarranty(req.params.orderId);
    if (!result.ok) {
      res.status(result.error === 'Warranty not found.' ? 404 : 400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get warranty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/warranty/vin/:vin - Get warranty by VIN
router.get('/vin/:vin', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const result = await warrantyService.getWarrantyByVin(req.params.vin);
    if (!result.ok) {
      res.status(result.error?.includes('not found') ? 404 : 400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get warranty by VIN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/warranty/:orderId/register - Register warranty for an order
router.post('/:orderId/register', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const result = await warrantyService.registerWarranty(req.params.orderId);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Register warranty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/warranty/:warrantyId/service - Add service record to warranty
router.post('/:warrantyId/service', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const { serviceDate, serviceType, description, kmAtService, cost, performedBy, nextServiceDate, nextServiceKm, documents } = req.body;
    if (!serviceDate || !serviceType) {
      res.status(400).json({ error: 'serviceDate and serviceType are required' });
      return;
    }

    const result = await warrantyService.addServiceRecord(req.params.warrantyId, {
      serviceDate: new Date(serviceDate),
      serviceType,
      description,
      kmAtService,
      cost,
      performedBy,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      nextServiceKm,
      documents,
    });

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Add service record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/warranty - List warranties with filters
router.get('/', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const { status, page, pageSize } = req.query;
    const result = await warrantyService.list({
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('List warranties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as warrantyRoutes };