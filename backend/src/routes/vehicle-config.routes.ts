import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { vehicleService } from '../services';
import { prisma } from '../config/database';

// Admin CRUD for the five per-vehicle configurator option models
// (VehicleColor, VehicleInterior, VehicleWheel, VehiclePackage,
// VehicleAccessory). The repository layer (backend/src/repositories/
// vehicle.repository.ts) and a thin service wrapper (backend/src/services/
// vehicles/vehicle.service.ts) already existed — including the
// default-flag-uniqueness transactions and the "global" (vehicleId: null)
// OR-scoping for wheels/accessories — but neither was ever wired up to an
// Express route, so every call from apps/admin/app/admin/vehicles/colors/
// page.tsx and .../models-variants/page.tsx 404'd.
//
// Mounted at /admin in routes/index.ts, so paths below become:
//   /api/admin/vehicle-colors(/:id)
//   /api/admin/vehicle-interiors(/:id)
//   /api/admin/vehicle-wheels(/:id)
//   /api/admin/vehicle-packages(/:id)
//   /api/admin/vehicle-accessories(/:id)

const router = Router();

// Every route below only ever required a valid admin session — any
// authenticated staff member of any role could create/edit/delete a
// vehicle's colors, interiors, wheels, packages, and accessories.
// canManageVehicles matches AdminLayout.tsx's "Manage Colors"/"Manage
// Models" nav items and apps/admin/app/admin/vehicles/colors|
// models-variants page.tsx's own useAdminAuth('canManageVehicles') guard —
// these config pages have no separate view-only mode, unlike the main
// vehicles list/detail pages (canViewVehicles).
const gate = requirePermission('canManageVehicles');

function requiredVehicleId(req: Request, res: Response): string | null {
  const vehicleId = req.query.vehicleId as string | undefined;
  if (!vehicleId) {
    res.status(400).json({ error: 'vehicleId query parameter is required' });
    return null;
  }
  return vehicleId;
}

/* ------------------------------------------------------------------ */
/* Colors (always vehicle-scoped)                                      */
/* ------------------------------------------------------------------ */

// ?vehicleId=<id> is the primary (real) lookup, used by
// apps/admin/app/admin/vehicles/colors/page.tsx to manage one vehicle's colors.
//
// ?vehicleName=<name> is a second, unrelated caller: QuotationPdfPanel.tsx only
// has Quotation.vehicleModel, a free-text snapshot of Vehicle.name taken at quote
// time (see apps/web/app/quote/page.tsx: `vehicleModel: selectedVehicle?.name`),
// not a real Vehicle.id — so it resolves the vehicle by name (best effort,
// case-insensitive) first. No match / no vehicleName just yields an empty list;
// the panel falls back to its free-text color input.
//
// The response also carries the resolved vehicle's `year` (Vehicle.year) and
// `price` (Vehicle.finalPrice || Vehicle.basePrice, the same "effective
// price" convention used everywhere else — see VehicleManagementClient.tsx,
// apps/web/app/configurator/page.tsx) — QuotationPdfPanel uses these to
// default the "Vehicle year" / "Unit price" fields from the database instead
// of a hardcoded guess or a blank input.
router.get('/vehicle-colors', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const vehicleId = req.query.vehicleId as string | undefined;
    const vehicleName = req.query.vehicleName as string | undefined;

    if (!vehicleId && !vehicleName) {
      res.status(400).json({ error: 'vehicleId or vehicleName query parameter is required' });
      return;
    }

    let resolvedVehicleId = vehicleId;
    let vehicleYear: number | null = null;
    let vehiclePrice: number | null = null;
    if (!resolvedVehicleId && vehicleName) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { name: { equals: vehicleName, mode: 'insensitive' } },
        select: { id: true, year: true, basePrice: true, finalPrice: true },
      });
      if (!vehicle) { res.json({ success: true, colors: [], year: null, price: null }); return; }
      resolvedVehicleId = vehicle.id;
      vehicleYear = vehicle.year;
      vehiclePrice = vehicle.finalPrice || vehicle.basePrice;
    } else if (resolvedVehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: resolvedVehicleId }, select: { year: true, basePrice: true, finalPrice: true } });
      vehicleYear = vehicle?.year ?? null;
      vehiclePrice = vehicle ? (vehicle.finalPrice || vehicle.basePrice) : null;
    }

    const result = await vehicleService.getColors(resolvedVehicleId!);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ success: true, colors: result.data, year: vehicleYear, price: vehiclePrice });
  } catch (error) {
    console.error('List vehicle colors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-colors', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { name, colorCode, vehicleId } = req.body || {};
    if (!name || !colorCode || !vehicleId) {
      res.status(400).json({ error: 'name, colorCode and vehicleId are required' });
      return;
    }
    const result = await vehicleService.createColor(req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create vehicle color error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-colors/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.updateColor(req.params.id, req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update vehicle color error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vehicle-colors/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.deleteColor(req.params.id);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle color error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Interior options (always vehicle-scoped)                             */
/* ------------------------------------------------------------------ */

router.get('/vehicle-interiors', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const vehicleId = requiredVehicleId(req, res);
    if (!vehicleId) return;
    const result = await vehicleService.getInteriors(vehicleId);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ interiors: result.data });
  } catch (error) {
    console.error('List vehicle interiors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-interiors', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { name, materialType, vehicleId } = req.body || {};
    if (!name || !materialType || !vehicleId) {
      res.status(400).json({ error: 'name, materialType and vehicleId are required' });
      return;
    }
    const result = await vehicleService.createInterior(req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create vehicle interior error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-interiors/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.updateInterior(req.params.id, req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update vehicle interior error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vehicle-interiors/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.deleteInterior(req.params.id);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle interior error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Wheels (vehicle-scoped, or global when vehicleId is null)           */
/* ------------------------------------------------------------------ */

router.get('/vehicle-wheels', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const vehicleId = requiredVehicleId(req, res);
    if (!vehicleId) return;
    const result = await vehicleService.getWheels(vehicleId);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ wheels: result.data });
  } catch (error) {
    console.error('List vehicle wheels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-wheels', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { name, size } = req.body || {};
    if (!name || !size) {
      res.status(400).json({ error: 'name and size are required' });
      return;
    }
    const result = await vehicleService.createWheel(req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create vehicle wheel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-wheels/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.updateWheel(req.params.id, req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update vehicle wheel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vehicle-wheels/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.deleteWheel(req.params.id);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle wheel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Packages / trim levels (always vehicle-scoped)                      */
/* ------------------------------------------------------------------ */

router.get('/vehicle-packages', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const vehicleId = requiredVehicleId(req, res);
    if (!vehicleId) return;
    const result = await vehicleService.getPackages(vehicleId);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ packages: result.data });
  } catch (error) {
    console.error('List vehicle packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-packages', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { name, vehicleId } = req.body || {};
    if (!name || !vehicleId) {
      res.status(400).json({ error: 'name and vehicleId are required' });
      return;
    }
    const result = await vehicleService.createPackage(req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create vehicle package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-packages/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.updatePackage(req.params.id, req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update vehicle package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vehicle-packages/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.deletePackage(req.params.id);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Accessories (vehicle-scoped, or global when vehicleId is null)      */
/* ------------------------------------------------------------------ */

router.get('/vehicle-accessories', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const vehicleId = requiredVehicleId(req, res);
    if (!vehicleId) return;
    const result = await vehicleService.getAccessories(vehicleId);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ accessories: result.data });
  } catch (error) {
    console.error('List vehicle accessories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-accessories', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body || {};
    if (!name || !category) {
      res.status(400).json({ error: 'name and category are required' });
      return;
    }
    const result = await vehicleService.createAccessory(req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create vehicle accessory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-accessories/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.updateAccessory(req.params.id, req.body);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update vehicle accessory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vehicle-accessories/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await vehicleService.deleteAccessory(req.params.id);
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle accessory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as vehicleConfigRoutes };
