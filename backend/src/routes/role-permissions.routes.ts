import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { rolePermissionRepository } from '../repositories';
import { ADMIN_ROLES, AdminRole, AdminPermissions } from '../types/auth.types';
import { ROLE_PERMISSIONS } from '../middleware/rolePermissions';

// Relocated from users.routes.ts, where these three handlers lived at
// router.get/patch('/admin/role-permissions', ...) — but that file is
// mounted at /admin/users, so they actually resolved to the double-nested
// /api/admin/users/admin/role-permissions. This router is meant to be
// mounted directly at /admin/role-permissions (top-level in index.ts), so
// its own paths resolve to exactly /api/admin/role-permissions, matching
// RolesPermissionsManager.tsx / RolePermissionPreview.tsx.
const router = Router();

router.use(requireAdminApiSession);

const LOCKED_ROLE = AdminRole.SUPER_ADMIN;

// Human labels for every key on the backend's AdminPermissions
// (types/auth.types.ts) — the set ROLE_PERMISSIONS / getEffectivePermissions()
// in middleware/auth.ts actually enforce. This is a *different*, smaller set
// than the legacy-inclusive AdminPermissions in the shared @geely/types
// package (which apps/admin/lib/auth/permissionGroups.ts and
// RolesPermissionsManager.tsx's `roleLabel`/`ADMIN_ROLES` imports draw
// from) — backend has no dependency on @geely/types, so the grouping below
// is reconstructed independently, restricted to keys that really exist
// (and are really enforced) on this side.
const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
  canManageContent: 'Manage Content',
  canViewContent: 'View Content',
  canManageVehicles: 'Manage Vehicles',
  canViewVehicles: 'View Vehicles',
  canManageTestDrives: 'Manage Test Drives',
  canViewTestDrives: 'View Test Drives',
  canManageQuotations: 'Manage Quotations',
  canViewQuotations: 'View Quotations',
  canCountersignAgreements: 'Countersign Agreements',
  canManageDealers: 'Manage Dealers',
  canViewDealers: 'View Dealers',
  canManageServiceBookings: 'Manage Service Bookings',
  canViewServiceBookings: 'View Service Bookings',
  canManageService: 'Manage Service',
  canManageSpareParts: 'Manage Spare Parts',
  canViewSpareParts: 'View Spare Parts',
  canManagePromotions: 'Manage Promotions',
  canViewPromotions: 'View Promotions',
  canModerateReviews: 'Moderate Reviews',
  canViewReviews: 'View Reviews',
  canManageNews: 'Manage News',
  canViewNews: 'View News',
  canManageMessages: 'Manage Messages',
  canViewMessages: 'View Messages',
  canViewAnalytics: 'View Analytics',
  canExportReports: 'Export Reports',
  canViewReports: 'View Reports',
  canManageUsers: 'Manage Users',
  canViewUsers: 'View Users',
  canManageSettings: 'Manage Settings',
  canViewSettings: 'View Settings',
  canViewJobCards: 'View Job Cards',
  canManageJobCards: 'Manage Job Cards',
  canManageBays: 'Manage Bays',
  canManageTechnicians: 'Manage Technicians',
  canPerformQC: 'Perform QC',
  canManagePartsIssue: 'Manage Parts Issue',
  canApproveWarrantyClaims: 'Approve Warranty Claims',
};

const PERMISSION_GROUP_KEYS: { label: string; keys: (keyof AdminPermissions)[] }[] = [
  { label: 'Content', keys: ['canManageContent', 'canViewContent', 'canManagePromotions', 'canViewPromotions', 'canModerateReviews', 'canViewReviews', 'canManageNews', 'canViewNews'] },
  { label: 'Vehicles', keys: ['canManageVehicles', 'canViewVehicles'] },
  { label: 'Test Drives', keys: ['canManageTestDrives', 'canViewTestDrives'] },
  { label: 'Quotations & Agreements', keys: ['canManageQuotations', 'canViewQuotations', 'canCountersignAgreements'] },
  { label: 'Dealers', keys: ['canManageDealers', 'canViewDealers'] },
  { label: 'Service Bookings', keys: ['canManageServiceBookings', 'canViewServiceBookings', 'canManageService'] },
  { label: 'Spare Parts', keys: ['canManageSpareParts', 'canViewSpareParts', 'canManagePartsIssue'] },
  { label: 'Messages', keys: ['canManageMessages', 'canViewMessages'] },
  { label: 'Analytics & Reports', keys: ['canViewAnalytics', 'canExportReports', 'canViewReports'] },
  { label: 'Users & Settings', keys: ['canManageUsers', 'canViewUsers', 'canManageSettings', 'canViewSettings'] },
  { label: 'Workshop', keys: ['canViewJobCards', 'canManageJobCards', 'canManageBays', 'canManageTechnicians', 'canPerformQC', 'canApproveWarrantyClaims'] },
];

const PERMISSION_GROUPS = PERMISSION_GROUP_KEYS.map((group) => ({
  label: group.label,
  keys: group.keys.map((key) => ({ key, label: PERMISSION_LABELS[key] })),
}));

// GET /api/admin/role-permissions — full matrix for RolesPermissionsManager.tsx.
// NOTE: the handler this replaces (users.routes.ts, ~line 145) just did
// `res.json(await rolePermissionRepository.findMany())` — a flat array of
// {role, permissionKey, value} override rows. RolesPermissionsManager.tsx
// needs `data.roles`, `data.lockedRole`, `data.permissionGroups`,
// `data.effective` and `data.overrides` — that array never had any of
// those keys, so even once the path is fixed the old logic would still
// leave the matrix broken (data.roles undefined). Built correctly here
// instead, reusing the same defaults+overrides merge as
// getEffectivePermissions() in middleware/auth.ts.
router.get('/', async (req: Request, res: Response) => {
  try {
    const overrides = await rolePermissionRepository.findMany();

    const overridesByRole: Record<string, Record<string, boolean>> = {};
    for (const o of overrides) {
      if (!overridesByRole[o.role]) overridesByRole[o.role] = {};
      overridesByRole[o.role][o.permissionKey] = o.value;
    }

    const effective: Record<string, Record<string, boolean>> = {};
    for (const role of ADMIN_ROLES) {
      effective[role] = { ...ROLE_PERMISSIONS[role], ...(overridesByRole[role] || {}) };
    }

    res.json({
      roles: ADMIN_ROLES,
      lockedRole: LOCKED_ROLE,
      permissionGroups: PERMISSION_GROUPS,
      effective,
      overrides: overridesByRole,
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/role-permissions (grant/revoke one override) — relocated
// verbatim from users.routes.ts, plus a guard against overriding the
// locked role (the UI already disables this, but the old handler didn't
// enforce it server-side).
router.patch('/', async (req: Request, res: Response) => {
  try {
    const { role, permissionKey, value } = req.body;
    if (role === LOCKED_ROLE) {
      res.status(400).json({ error: `${LOCKED_ROLE} always has full access and cannot be overridden` });
      return;
    }
    const updated = await rolePermissionRepository.upsert(role, permissionKey, value, req.adminSession!.user.id);
    res.json(updated);
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/role-permissions?role=X[&permissionKey=Y] — reset one
// override, or every override for a role, back to the hardcoded default.
// This is new: rolePermissionRepository.deleteMany existed but was called
// by no route anywhere, yet RolesPermissionsManager.tsx's per-cell reset
// button and "Reset all" button already call exactly this URL shape.
router.delete('/', async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string;
    const permissionKey = req.query.permissionKey as string | undefined;
    if (!role) {
      res.status(400).json({ error: 'role is required' });
      return;
    }
    const result = await rolePermissionRepository.deleteMany(role, permissionKey);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Reset role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as rolePermissionsRoutes };
