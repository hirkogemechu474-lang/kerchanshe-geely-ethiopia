// Admin user roles and permissions
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  SERVICE = 'service',
  MARKETING = 'marketing',
  SERVICE_ADVISOR = 'service_advisor',
  SERVICE_MANAGER = 'service_manager',
  // Public portal roles — NO admin panel access
  CUSTOMER = 'customer',
  DEALER = 'dealer',
}

export interface AdminPermissions {
  // Content Management
  canManageContent: boolean;
  canViewContent: boolean;

  // Vehicle Management
  canManageVehicles: boolean;
  canViewVehicles: boolean;

  // Test Drives
  canManageTestDrives: boolean;
  canViewTestDrives: boolean;

  // Quotations
  canManageQuotations: boolean;
  canViewQuotations: boolean;

  // Dealers
  canManageDealers: boolean;
  canViewDealers: boolean;

  // Service Bookings
  canManageServiceBookings: boolean;
  canViewServiceBookings: boolean;
  canManageService: boolean; // Alias for canManageServiceBookings

  // Spare Parts
  canManageSpareParts: boolean;
  canViewSpareParts: boolean;

  // Promotions
  canManagePromotions: boolean;
  canViewPromotions: boolean;

  // Reviews
  canModerateReviews: boolean;
  canViewReviews: boolean;

  // News
  canManageNews: boolean;
  canViewNews: boolean;

  // Messages
  canManageMessages: boolean;
  canViewMessages: boolean;

  // Analytics & Reports
  canViewAnalytics: boolean;
  canExportReports: boolean;
  canViewReports: boolean; // Alias for canViewAnalytics

  // Users
  canManageUsers: boolean;
  canViewUsers: boolean;

  // Settings
  canManageSettings: boolean;
  canViewSettings: boolean;

  // Workshop & Job Cards (SWMS)
  canViewJobCards: boolean;
  canManageJobCards: boolean;
  canManageBays: boolean;
  canManageTechnicians: boolean;
  canPerformQC: boolean;

  // Parts Issued Against a Job Card + Warranty Claims (SWMS Phase 2)
  canManagePartsIssue: boolean; // issue/backorder/cancel a JobCardPart line (parts-counter action)
  canApproveWarrantyClaims: boolean; // move a claim through Under Review -> Approved/Rejected/Reimbursed
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermissions;
  dealerId?: string; // For dealer-specific staff
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

// Role-based permission presets
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  [AdminRole.SUPER_ADMIN]: {
    canManageContent: true,
    canViewContent: true,
    canManageVehicles: true,
    canViewVehicles: true,
    canManageTestDrives: true,
    canViewTestDrives: true,
    canManageQuotations: true,
    canViewQuotations: true,
    canManageDealers: true,
    canViewDealers: true,
    canManageServiceBookings: true,
    canViewServiceBookings: true,
    canManageService: true,
    canManageSpareParts: true,
    canViewSpareParts: true,
    canManagePromotions: true,
    canViewPromotions: true,
    canModerateReviews: true,
    canViewReviews: true,
    canManageNews: true,
    canViewNews: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: true,
    canViewReports: true,
    canManageUsers: true,
    canViewUsers: true,
    canManageSettings: true,
    canViewSettings: true,
    canViewJobCards: true,
    canManageJobCards: true,
    canManageBays: true,
    canManageTechnicians: true,
    canPerformQC: true,
    canManagePartsIssue: true,
    canApproveWarrantyClaims: true,
  },
  [AdminRole.ADMIN]: {
    // Same as super_admin - full permissions
    canManageContent: true,
    canViewContent: true,
    canManageVehicles: true,
    canViewVehicles: true,
    canManageTestDrives: true,
    canViewTestDrives: true,
    canManageQuotations: true,
    canViewQuotations: true,
    canManageDealers: true,
    canViewDealers: true,
    canManageServiceBookings: true,
    canViewServiceBookings: true,
    canManageService: true,
    canManageSpareParts: true,
    canViewSpareParts: true,
    canManagePromotions: true,
    canViewPromotions: true,
    canModerateReviews: true,
    canViewReviews: true,
    canManageNews: true,
    canViewNews: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: true,
    canViewReports: true,
    canManageUsers: true,
    canViewUsers: true,
    canManageSettings: true,
    canViewSettings: true,
    canViewJobCards: true,
    canManageJobCards: true,
    canManageBays: true,
    canManageTechnicians: true,
    canPerformQC: true,
    canManagePartsIssue: true,
    canApproveWarrantyClaims: true,
  },
  [AdminRole.MANAGER]: {
    canManageContent: true,
    canViewContent: true,
    canManageVehicles: true,
    canViewVehicles: true,
    canManageTestDrives: true,
    canViewTestDrives: true,
    canManageQuotations: true,
    canViewQuotations: true,
    canManageDealers: false,
    canViewDealers: true,
    canManageServiceBookings: true,
    canViewServiceBookings: true,
    canManageService: true,
    canManageSpareParts: true,
    canViewSpareParts: true,
    canManagePromotions: true,
    canViewPromotions: true,
    canModerateReviews: true,
    canViewReviews: true,
    canManageNews: true,
    canViewNews: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: true,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: true,
    canManageSettings: false,
    canViewSettings: true,
    canViewJobCards: true,
    canManageJobCards: true,
    canManageBays: true,
    canManageTechnicians: true,
    canPerformQC: true,
    canManagePartsIssue: true,
    canApproveWarrantyClaims: true,
  },
  [AdminRole.SALES]: {
    canManageContent: false,
    canViewContent: true,
    canManageVehicles: false,
    canViewVehicles: true,
    canManageTestDrives: true,
    canViewTestDrives: true,
    canManageQuotations: true,
    canViewQuotations: true,
    canManageDealers: false,
    canViewDealers: true,
    canManageServiceBookings: false,
    canViewServiceBookings: false,
    canManageService: false,
    canManageSpareParts: false,
    canViewSpareParts: true,
    canManagePromotions: false,
    canViewPromotions: true,
    canModerateReviews: false,
    canViewReviews: true,
    canManageNews: false,
    canViewNews: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: false,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: false,
    canManageSettings: false,
    canViewSettings: false,
    canViewJobCards: false,
    canManageJobCards: false,
    canManageBays: false,
    canManageTechnicians: false,
    canPerformQC: false,
    canManagePartsIssue: false,
    canApproveWarrantyClaims: false,
  },
  [AdminRole.SERVICE]: {
    canManageContent: false,
    canViewContent: false,
    canManageVehicles: false,
    canViewVehicles: true,
    canManageTestDrives: false,
    canViewTestDrives: false,
    canManageQuotations: false,
    canViewQuotations: false,
    canManageDealers: false,
    canViewDealers: true,
    canManageServiceBookings: true,
    canViewServiceBookings: true,
    canManageService: true,
    canManageSpareParts: true,
    canViewSpareParts: true,
    canManagePromotions: false,
    canViewPromotions: false,
    canModerateReviews: false,
    canViewReviews: false,
    canManageNews: false,
    canViewNews: false,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: false,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: false,
    canManageSettings: false,
    canViewSettings: false,
    canViewJobCards: true,
    canManageJobCards: true,
    canManageBays: false,
    canManageTechnicians: false,
    canPerformQC: false,
    canManagePartsIssue: false,
    canApproveWarrantyClaims: false,
  },
  [AdminRole.MARKETING]: {
    canManageContent: true,
    canViewContent: true,
    canManageVehicles: false,
    canViewVehicles: true,
    canManageTestDrives: false,
    canViewTestDrives: true,
    canManageQuotations: false,
    canViewQuotations: true,
    canManageDealers: false,
    canViewDealers: true,
    canManageServiceBookings: false,
    canViewServiceBookings: false,
    canManageService: false,
    canManageSpareParts: false,
    canViewSpareParts: false,
    canManagePromotions: true,
    canViewPromotions: true,
    canModerateReviews: true,
    canViewReviews: true,
    canManageNews: true,
    canViewNews: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: true,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: false,
    canManageSettings: false,
    canViewSettings: false,
    canViewJobCards: false,
    canManageJobCards: false,
    canManageBays: false,
    canManageTechnicians: false,
    canPerformQC: false,
    canManagePartsIssue: false,
    canApproveWarrantyClaims: false,
  },

  // ── Workshop roles (SWMS) ──────────────────────────────────────────────────
  // Service Advisor: runs the front desk — write-up, diagnosis capture,
  // customer approval, assigning technician/bay, requesting parts, drafting
  // and submitting warranty claims — but cannot sign off QC, issue parts at
  // the counter, or approve/reject a warranty claim.
  [AdminRole.SERVICE_ADVISOR]: {
    canManageContent: false,
    canViewContent: false,
    canManageVehicles: false,
    canViewVehicles: true,
    canManageTestDrives: false,
    canViewTestDrives: false,
    canManageQuotations: false,
    canViewQuotations: false,
    canManageDealers: false,
    canViewDealers: true,
    canManageServiceBookings: true,
    canViewServiceBookings: true,
    canManageService: true,
    canManageSpareParts: false,
    canViewSpareParts: true,
    canManagePromotions: false,
    canViewPromotions: false,
    canModerateReviews: false,
    canViewReviews: false,
    canManageNews: false,
    canViewNews: false,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: false,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: false,
    canManageSettings: false,
    canViewSettings: false,
    canViewJobCards: true,
    canManageJobCards: true,
    canManageBays: false,
    canManageTechnicians: false,
    canPerformQC: false,
    canManagePartsIssue: false,
    canApproveWarrantyClaims: false,
  },
  // Service Manager: owns the whole workshop floor — bay/technician roster,
  // QC sign-off, parts issue at the counter, warranty claim approval, and the
  // workshop KPI dashboard.
  [AdminRole.SERVICE_MANAGER]: {
    canManageContent: false,
    canViewContent: true,
    canManageVehicles: false,
    canViewVehicles: true,
    canManageTestDrives: false,
    canViewTestDrives: true,
    canManageQuotations: false,
    canViewQuotations: true,
    canManageDealers: false,
    canViewDealers: true,
    canManageServiceBookings: true,
    canViewServiceBookings: true,
    canManageService: true,
    canManageSpareParts: true,
    canViewSpareParts: true,
    canManagePromotions: false,
    canViewPromotions: false,
    canModerateReviews: false,
    canViewReviews: false,
    canManageNews: false,
    canViewNews: false,
    canManageMessages: true,
    canViewMessages: true,
    canViewAnalytics: true,
    canExportReports: true,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: false,
    canManageSettings: false,
    canViewSettings: false,
    canViewJobCards: true,
    canManageJobCards: true,
    canManageBays: true,
    canManageTechnicians: true,
    canPerformQC: true,
    canManagePartsIssue: true,
    canApproveWarrantyClaims: true,
  },

  // ── Public portal roles ────────────────────────────────────────────────────
  // CUSTOMER and DEALER have zero admin permissions. They authenticate via
  // /api/auth/login (JWT cookie) and can only access public-facing pages.
  [AdminRole.CUSTOMER]: {
    canManageContent: false, canViewContent: false,
    canManageVehicles: false, canViewVehicles: false,
    canManageTestDrives: false, canViewTestDrives: false,
    canManageQuotations: false, canViewQuotations: false,
    canManageDealers: false, canViewDealers: false,
    canManageServiceBookings: false, canViewServiceBookings: false,
    canManageService: false,
    canManageSpareParts: false, canViewSpareParts: false,
    canManagePromotions: false, canViewPromotions: false,
    canModerateReviews: false, canViewReviews: false,
    canManageNews: false, canViewNews: false,
    canManageMessages: false, canViewMessages: false,
    canViewAnalytics: false, canExportReports: false, canViewReports: false,
    canManageUsers: false, canViewUsers: false,
    canManageSettings: false, canViewSettings: false,
    canViewJobCards: false, canManageJobCards: false,
    canManageBays: false, canManageTechnicians: false, canPerformQC: false,
    canManagePartsIssue: false, canApproveWarrantyClaims: false,
  },

  [AdminRole.DEALER]: {
    canManageContent: false, canViewContent: false,
    canManageVehicles: false, canViewVehicles: false,
    canManageTestDrives: false, canViewTestDrives: false,
    canManageQuotations: false, canViewQuotations: false,
    canManageDealers: false, canViewDealers: false,
    canManageServiceBookings: false, canViewServiceBookings: false,
    canManageService: false,
    canManageSpareParts: false, canViewSpareParts: false,
    canManagePromotions: false, canViewPromotions: false,
    canModerateReviews: false, canViewReviews: false,
    canManageNews: false, canViewNews: false,
    canManageMessages: false, canViewMessages: false,
    canViewAnalytics: false, canExportReports: false, canViewReports: false,
    canManageUsers: false, canViewUsers: false,
    canManageSettings: false, canViewSettings: false,
    canViewJobCards: false, canManageJobCards: false,
    canManageBays: false, canManageTechnicians: false, canPerformQC: false,
    canManagePartsIssue: false, canApproveWarrantyClaims: false,
  },
};

export function getPermissionsForRole(role: AdminRole): AdminPermissions {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(user: AdminUser, permission: keyof AdminPermissions): boolean {
  return user.permissions[permission] === true;
}

// Roles that are allowed to access the admin panel
export const ADMIN_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.ADMIN,
  AdminRole.MANAGER,
  AdminRole.SALES,
  AdminRole.SERVICE,
  AdminRole.MARKETING,
  AdminRole.SERVICE_ADVISOR,
  AdminRole.SERVICE_MANAGER,
];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as AdminRole);
}

// Roles for the public portal only
export const PUBLIC_ROLES: AdminRole[] = [
  AdminRole.CUSTOMER,
  AdminRole.DEALER,
];

export function isPublicRole(role: string): boolean {
  return PUBLIC_ROLES.includes(role as AdminRole);
}
