// ── Auth Types (SUPERSET of web + admin) ────────────────────────────────

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  SERVICE = 'service',
  MARKETING = 'marketing',
  SERVICE_ADVISOR = 'service_advisor',
  SERVICE_MANAGER = 'service_manager',
  GM_GEELY = 'gm_geely',
  SALES_MANAGER = 'sales_manager',
  AFTER_SALES_MANAGER = 'after_sales_manager',
  SALES_REPRESENTATIVE = 'sales_representative',
  WORKSHOP_MANAGER = 'workshop_manager',
  CUSTOMER = 'customer',
  DEALER = 'dealer',
}

export interface AdminPermissions {
  canManageContent: boolean;
  canViewContent: boolean;
  canManageVehicles: boolean;
  canViewVehicles: boolean;
  canManageTestDrives: boolean;
  canViewTestDrives: boolean;
  canManageQuotations: boolean;
  canViewQuotations: boolean;
  canCountersignAgreements: boolean;
  canManageDealers: boolean;
  canViewDealers: boolean;
  canManageServiceBookings: boolean;
  canViewServiceBookings: boolean;
  canManageService: boolean;
  canManageSpareParts: boolean;
  canViewSpareParts: boolean;
  canManagePromotions: boolean;
  canViewPromotions: boolean;
  canModerateReviews: boolean;
  canViewReviews: boolean;
  canManageNews: boolean;
  canViewNews: boolean;
  canManageMessages: boolean;
  canViewMessages: boolean;
  canViewAnalytics: boolean;
  canExportReports: boolean;
  canViewReports: boolean;
  // Gates the Analytics / CRM Dashboard / Executive Overview (formerly
  // Workshop BI) pages specifically — deliberately separate from
  // canViewReports, which is also used by Report Export, Manage Workflow,
  // and the Audit Log and stays true for every staff role. This one is
  // manager-tier and up only (see ROLE_PERMISSIONS in rolePermissions.ts).
  canViewExecutiveDashboards: boolean;
  canManageUsers: boolean;
  canViewUsers: boolean;
  canManageSettings: boolean;
  canViewSettings: boolean;
  canViewJobCards: boolean;
  canManageJobCards: boolean;
  canManageBays: boolean;
  canManageTechnicians: boolean;
  canPerformQC: boolean;
  canManagePartsIssue: boolean;
  canApproveWarrantyClaims: boolean;
  // Existed on apps/admin's AdminPermissions (lib/auth/types.ts) but had no
  // backend counterpart at all — the Customers and Warranty Claims admin
  // pages could gate themselves on these client-side, but the backend had
  // no field to enforce them with even if a route wanted to.
  canViewCustomers: boolean;
  canManageCustomers: boolean;
  canManageWarrantyClaims: boolean;
  // Ported from apps/admin's AdminPermissions for full parity — previously
  // frontend-only fields with no backend field to enforce them at all.
  canManageOrders: boolean;
  canManageInventory: boolean;
  canManageWorkshop: boolean;
  canManageFinance: boolean;
  canManagePurchases: boolean;
  canManageSignatures: boolean;
  canManageShowroomVisits: boolean;
  canManageSiteNavigation: boolean;
  canManageRoles: boolean;
  canManageParts: boolean;
  canManageReviews: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermissions;
  dealerId?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'dealer';
}

export const ADMIN_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER,
  AdminRole.SALES, AdminRole.SERVICE, AdminRole.MARKETING,
  AdminRole.SERVICE_ADVISOR, AdminRole.SERVICE_MANAGER,
  AdminRole.GM_GEELY, AdminRole.SALES_MANAGER,
  AdminRole.AFTER_SALES_MANAGER, AdminRole.SALES_REPRESENTATIVE,
  AdminRole.WORKSHOP_MANAGER,
];

export const PUBLIC_ROLES: AdminRole[] = [AdminRole.CUSTOMER, AdminRole.DEALER];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function isPublicRole(role: string): boolean {
  return PUBLIC_ROLES.includes(role as AdminRole);
}

export function hasPermission(user: AdminUser, permission: keyof AdminPermissions): boolean {
  return user.permissions[permission] === true;
}
