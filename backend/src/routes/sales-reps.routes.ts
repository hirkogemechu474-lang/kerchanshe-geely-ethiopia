import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

router.use(requireAdminApiSession);

// Roles assignable as a quotation/order sales rep — mirrors ASSIGNABLE_ROLES
// in apps/admin/lib/assignSalesRep.ts and OrderCommissionPanel.tsx. Keep all
// three lists in sync if a role is added.
const ASSIGNABLE_ROLES = ['sales', 'sales_manager', 'general_manager', 'admin', 'sales_representative', 'super_admin'];

// GET /api/admin/sales-reps — lightweight rep list for assignment dropdowns
// (AssignedToPanel, OrderCommissionPanel). Deliberately separate from
// GET /api/admin/users: that route is gated behind canManageUsers (staff
// account management), which sales/sales_manager/manager users assigning a
// quotation or order don't have — they only have canManageQuotations/
// canManageOrders. Gating on those instead, and returning only the fields
// an assignment dropdown needs (no email or other PII).
router.get('/', async (req: Request, res: Response) => {
  try {
    const permissions = req.adminSession!.user.permissions;
    if (!permissions.canManageQuotations && !permissions.canManageOrders && !permissions.canManageUsers) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    const reps = await prisma.user.findMany({
      where: { role: { in: ASSIGNABLE_ROLES }, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });

    res.json({ items: reps });
  } catch (error) {
    console.error('List sales reps error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as salesRepsRoutes };
