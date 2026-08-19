// Admin user roles and permissions
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  SERVICE = 'service',
  MARKETING = 'marketing',
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
  
  // CRM & Integrations
  canManageCRM: boolean;
  canViewCRM: boolean;
  canManageIntegrations: boolean; // For CRM and other integrations
  
  // Settings
  canManageSettings: boolean;
  canViewSettings: boolean;
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
    canManageCRM: true,
    canViewCRM: true,
    canManageIntegrations: true,
    canManageSettings: true,
    canViewSettings: true,
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
    canManageCRM: true,
    canViewCRM: true,
    canManageIntegrations: true,
    canManageSettings: true,
    canViewSettings: true,
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
    canManageCRM: true,
    canViewCRM: true,
    canManageIntegrations: false,
    canManageSettings: false,
    canViewSettings: true,
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
    canManageCRM: true,
    canViewCRM: true,
    canManageIntegrations: false,
    canManageSettings: false,
    canViewSettings: false,
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
    canManageCRM: false,
    canViewCRM: true,
    canManageIntegrations: false,
    canManageSettings: false,
    canViewSettings: false,
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
    canManageCRM: false,
    canViewCRM: true,
    canManageIntegrations: false,
    canManageSettings: false,
    canViewSettings: false,
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
    canManageCRM: false, canViewCRM: false, canManageIntegrations: false,
    canManageSettings: false, canViewSettings: false,
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
    canManageCRM: false, canViewCRM: false, canManageIntegrations: false,
    canManageSettings: false, canViewSettings: false,
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
