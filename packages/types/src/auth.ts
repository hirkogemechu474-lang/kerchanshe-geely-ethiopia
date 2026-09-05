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
  VIEWER = 'viewer',
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

  // Legacy/admin-only permissions (from admin's local types)
  canManageOrders: boolean;
  canManageCustomers: boolean;
  canManageInventory: boolean;
  canManageWorkshop: boolean;
  canManageFinance: boolean;
  canManagePurchases: boolean;
  canManageSignatures: boolean;
  canManageShowroomVisits: boolean;
  canManageSiteNavigation: boolean;
  canViewCustomers: boolean;
  canManageRoles: boolean;
  canManageWarrantyClaims: boolean;
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

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
  expires: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    permissions: AdminPermissions;
    expires: string;
  };
}

// Default permissions for all roles (full superset)
const defaultPermissions: AdminPermissions = {
  canManageContent: false, canViewContent: false,
  canManageVehicles: false, canViewVehicles: false,
  canManageTestDrives: false, canViewTestDrives: false,
  canManageQuotations: false, canViewQuotations: false,
  canCountersignAgreements: false,
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
  canManageBays: false, canManageTechnicians: false,
  canPerformQC: false, canManagePartsIssue: false, canApproveWarrantyClaims: false,
  // Legacy
  canManageOrders: false, canManageCustomers: false, canManageInventory: false,
  canManageWorkshop: false, canManageFinance: false, canManagePurchases: false,
  canManageSignatures: false, canManageShowroomVisits: false, canManageSiteNavigation: false,
  canViewCustomers: false, canManageRoles: false, canManageWarrantyClaims: false,
  canManageParts: false, canManageReviews: false,
};

const allTrue = { ...defaultPermissions };
Object.keys(allTrue).forEach(k => { (allTrue as any)[k] = true; });

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: { ...allTrue },
  admin: { ...allTrue },
  manager: {
    ...defaultPermissions,
    canManageVehicles: true, canManageOrders: true, canManageCustomers: true,
    canManageInventory: true, canManageWorkshop: true, canManageContent: true,
    canViewAnalytics: true, canManageDealers: true, canManageTestDrives: true,
    canManageServiceBookings: true, canManageParts: true, canManageReviews: true,
    canManageNews: true, canManagePromotions: true, canViewJobCards: true,
    canManageJobCards: true, canManageQuotations: true, canManagePurchases: true,
    canManageShowroomVisits: true, canViewCustomers: true, canManageMessages: true,
    canViewVehicles: true, canManageWarrantyClaims: true, canManageBays: true,
    canManageTechnicians: true, canManageService: true, canManageSpareParts: true,
    canViewSpareParts: true, canViewQuotations: true, canViewDealers: true,
    canViewTestDrives: true, canViewMessages: true, canViewReports: true,
    canCountersignAgreements: true, canApproveWarrantyClaims: true, canPerformQC: true,
    canManagePartsIssue: true, canExportReports: true,
    // Legacy
    canManageFinance: false, canManageSettings: false, canManageSignatures: false,
    canManageSiteNavigation: false, canManageRoles: false,
  },
  sales: {
    ...defaultPermissions,
    canManageOrders: true, canManageCustomers: true, canViewAnalytics: true,
    canManageTestDrives: true, canManageQuotations: true, canManageShowroomVisits: true,
    canViewCustomers: true, canViewVehicles: true, canViewQuotations: true,
    canViewTestDrives: true,
  },
  service: {
    ...defaultPermissions,
    canManageInventory: true, canManageWorkshop: true, canManageServiceBookings: true,
    canManageParts: true, canViewJobCards: true, canManageJobCards: true,
    canManageWarrantyClaims: true, canManageBays: true, canManageTechnicians: true,
    canManageService: true, canManageSpareParts: true, canViewSpareParts: true,
    canApproveWarrantyClaims: true, canPerformQC: true, canManagePartsIssue: true,
  },
  marketing: {
    ...defaultPermissions,
    canManageContent: true, canViewContent: true, canManagePromotions: true,
    canViewPromotions: true, canManageNews: true, canViewNews: true,
    canManageReviews: true, canViewReviews: true, canViewAnalytics: true,
    canViewVehicles: true, canViewDealers: true,
  },
  service_advisor: {
    ...defaultPermissions,
    canViewJobCards: true, canManageJobCards: true, canManageServiceBookings: true,
    canManageTestDrives: true, canViewTestDrives: true, canViewServiceBookings: true,
    canViewVehicles: true, canViewCustomers: true, canManageMessages: true,
    canViewMessages: true, canViewQuotations: true,
  },
  service_manager: {
    ...defaultPermissions,
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canManageSpareParts: true, canViewSpareParts: true, canViewJobCards: true,
    canManageJobCards: true, canManageBays: true, canManageTechnicians: true,
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true, canPerformQC: true,
    canManagePartsIssue: true, canManageInventory: true, canViewAnalytics: true,
    canViewReports: true,
  },
  gm_geely: {
    ...allTrue,
  },
  sales_manager: {
    ...defaultPermissions,
    canManageOrders: true, canManageCustomers: true, canManageQuotations: true,
    canManagePurchases: true, canManageShowroomVisits: true, canViewCustomers: true,
    canManageVehicles: true, canViewVehicles: true, canManageTestDrives: true,
    canViewTestDrives: true, canViewAnalytics: true, canViewReports: true,
    canCountersignAgreements: true, canManageDealers: true, canViewDealers: true,
  },
  after_sales_manager: {
    ...defaultPermissions,
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canManageSpareParts: true, canViewSpareParts: true, canViewJobCards: true,
    canManageJobCards: true, canManageBays: true, canManageTechnicians: true,
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true, canPerformQC: true,
    canManagePartsIssue: true, canManageInventory: true, canViewAnalytics: true,
    canViewReports: true, canManageMessages: true, canViewMessages: true,
  },
  sales_representative: {
    ...defaultPermissions,
    canManageOrders: true, canManageCustomers: true, canManageQuotations: true,
    canManageShowroomVisits: true, canViewCustomers: true, canViewVehicles: true,
    canManageTestDrives: true, canViewTestDrives: true, canViewAnalytics: true,
  },
  workshop_manager: {
    ...defaultPermissions,
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canManageSpareParts: true, canViewSpareParts: true, canViewJobCards: true,
    canManageJobCards: true, canManageBays: true, canManageTechnicians: true,
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true, canPerformQC: true,
    canManagePartsIssue: true, canManageInventory: true, canViewAnalytics: true,
    canViewReports: true,
  },
  viewer: {
    ...defaultPermissions,
    canViewAnalytics: true, canViewReports: true, canViewVehicles: true,
    canViewQuotations: true, canViewDealers: true, canViewTestDrives: true,
    canViewMessages: true, canViewReviews: true, canViewNews: true,
    canViewSpareParts: true, canViewServiceBookings: true,
  },
  customer: { ...defaultPermissions },
  dealer: { ...defaultPermissions },
};

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

// ── Permission Groups (for UI grouping) ──────────────────────────────────

export const PERMISSION_GROUPS: Record<string, { label: string; permissions: string[] }> = {
  users: { label: 'User Management', permissions: ['canManageUsers', 'canViewUsers', 'canManageRoles'] },
  vehicles: { label: 'Vehicle Management', permissions: ['canManageVehicles', 'canViewVehicles'] },
  orders: { label: 'Order Management', permissions: ['canManageOrders', 'canManagePurchases', 'canManageQuotations', 'canViewQuotations', 'canCountersignAgreements', 'canManageShowroomVisits'] },
  customers: { label: 'Customer Management', permissions: ['canManageCustomers', 'canViewCustomers'] },
  inventory: { label: 'Inventory Management', permissions: ['canManageInventory', 'canManageWorkshop', 'canManageSpareParts', 'canViewSpareParts'] },
  workshop: { label: 'Workshop Management', permissions: ['canManageWorkshop', 'canViewJobCards', 'canManageJobCards', 'canManageBays', 'canManageTechnicians', 'canPerformQC', 'canManagePartsIssue', 'canManageWarrantyClaims', 'canApproveWarrantyClaims'] },
  finance: { label: 'Finance Management', permissions: ['canManageFinance', 'canManagePurchases'] },
  content: { label: 'Content Management', permissions: ['canManageContent', 'canViewContent', 'canManagePromotions', 'canViewPromotions', 'canModerateReviews', 'canViewReviews', 'canManageNews', 'canViewNews'] },
  analytics: { label: 'Analytics', permissions: ['canViewAnalytics', 'canExportReports', 'canViewReports'] },
  settings: { label: 'Settings', permissions: ['canManageSettings', 'canViewSettings', 'canManageSiteNavigation'] },
  dealers: { label: 'Dealer Management', permissions: ['canManageDealers', 'canViewDealers'] },
  testDrives: { label: 'Test Drive Management', permissions: ['canManageTestDrives', 'canViewTestDrives'] },
  serviceBookings: { label: 'Service Booking Management', permissions: ['canManageServiceBookings', 'canViewServiceBookings'] },
  parts: { label: 'Parts Management', permissions: ['canManageParts', 'canManageSpareParts', 'canViewSpareParts'] },
  reviews: { label: 'Review Management', permissions: ['canManageReviews', 'canViewReviews'] },
  news: { label: 'News Management', permissions: ['canManageNews', 'canViewNews'] },
  promotions: { label: 'Promotion Management', permissions: ['canManagePromotions', 'canViewPromotions'] },
};

export function roleLabel(role: string): string {
  const labels: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    manager: 'Manager',
    sales: 'Sales',
    service: 'Service',
    marketing: 'Marketing',
    service_advisor: 'Service Advisor',
    service_manager: 'Service Manager',
    gm_geely: 'GM Geely',
    sales_manager: 'Sales Manager',
    after_sales_manager: 'After Sales Manager',
    sales_representative: 'Sales Representative',
    workshop_manager: 'Workshop Manager',
    viewer: 'Viewer',
    customer: 'Customer',
    dealer: 'Dealer',
  };
  return labels[role as AdminRole] || role;
}

// ── Role Options (for dropdowns) ────────────────────────────────────────

export const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
  { value: 'manager', label: 'Manager', description: 'Management-level access' },
  { value: 'sales', label: 'Sales', description: 'Sales team access' },
  { value: 'service', label: 'Service', description: 'Service workshop access' },
  { value: 'marketing', label: 'Marketing', description: 'Marketing and content access' },
  { value: 'service_advisor', label: 'Service Advisor', description: 'Service advisor access' },
  { value: 'service_manager', label: 'Service Manager', description: 'Service workshop management' },
  { value: 'gm_geely', label: 'GM Geely', description: 'General Manager Geely access' },
  { value: 'sales_manager', label: 'Sales Manager', description: 'Sales management access' },
  { value: 'after_sales_manager', label: 'After Sales Manager', description: 'After-sales management' },
  { value: 'sales_representative', label: 'Sales Representative', description: 'Sales representative access' },
  { value: 'workshop_manager', label: 'Workshop Manager', description: 'Workshop management access' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to admin dashboard' },
];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Full system access',
  admin: 'Full administrative access',
  manager: 'Management-level access',
  sales: 'Sales team access',
  service: 'Service workshop access',
  marketing: 'Marketing and content access',
  service_advisor: 'Service advisor access',
  service_manager: 'Service workshop management',
  gm_geely: 'General Manager Geely access',
  sales_manager: 'Sales management access',
  after_sales_manager: 'After-sales management',
  sales_representative: 'Sales representative access',
  workshop_manager: 'Workshop management access',
  viewer: 'Read-only access',
};