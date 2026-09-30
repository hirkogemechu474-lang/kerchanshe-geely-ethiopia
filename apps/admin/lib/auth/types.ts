// ── Auth Types (admin-local) ─────────────────────────────────────────────

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  SERVICE = 'service',
  MARKETING = 'marketing',
  SERVICE_ADVISOR = 'service_advisor',
  RECEPTION = 'reception',
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
  // Gates CRM Dashboard and Workshop BI (nav + routes), and branches the
  // Analytics/"Executive Overview" page's content between the light,
  // individual-contributor view and the full dashboard — manager-tier and up
  // only, unlike canViewReports (kept true for every staff role; still used
  // by Report Export, Manage Workflow, Audit Log). Mirrors
  // backend/src/types/auth.types.ts's field of the same name.
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
  canViewExecutiveDashboards: false,
  canManageUsers: false, canViewUsers: false,
  canManageSettings: false, canViewSettings: false,
  canViewJobCards: false, canManageJobCards: false,
  canManageBays: false, canManageTechnicians: false,
  canPerformQC: false, canManagePartsIssue: false, canApproveWarrantyClaims: false,
  canManageOrders: false, canManageCustomers: false, canManageInventory: false,
  canManageWorkshop: false, canManageFinance: false, canManagePurchases: false,
  canManageSignatures: false, canManageShowroomVisits: false, canManageSiteNavigation: false,
  canViewCustomers: false, canManageRoles: false, canManageWarrantyClaims: false,
  canManageParts: false, canManageReviews: false,
};

const allTrue = { ...defaultPermissions };
Object.keys(allTrue).forEach(k => { (allTrue as any)[k] = true; });

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  // ── Super Admin / Admin: full access to everything ──
  super_admin: { ...allTrue },
  admin: { ...allTrue },

  // ── GM Geely: broad oversight + approvals, not day-to-day operational
  //    management — mirrors backend/src/middleware/rolePermissions.ts's
  //    GM_GEELY exactly. This used to be `{ ...allTrue }` here, contradicting
  //    the backend's deliberately scoped-down version (e.g. it never granted
  //    canManageSpareParts/canManageUsers/canManageSettings) — the sidebar
  //    showed manage-level links the backend would 403 on for this role.
  gm_geely: {
    ...defaultPermissions,
    canViewContent: true,
    canViewVehicles: true,
    canViewTestDrives: true,
    canManageQuotations: true, canViewQuotations: true,
    canManageDealers: true, canViewDealers: true,
    canViewServiceBookings: true,
    canViewSpareParts: true,
    canViewPromotions: true,
    canViewReviews: true,
    canViewNews: true,
    canViewMessages: true,
    canViewAnalytics: true, canExportReports: true, canViewReports: true,
    canViewExecutiveDashboards: true,
    canViewUsers: true,
    canViewSettings: true,
    canViewJobCards: true,
    canApproveWarrantyClaims: true,
    canViewCustomers: true,
  },

  // ── Manager: department head — approves quotations, agreements, delivery,
  //    manages all workshop/service, views all analytics ──
  manager: {
    ...defaultPermissions,
    // Quotation workflow (review, approve, reject, sign)
    canManageQuotations: true, canViewQuotations: true,
    canCountersignAgreements: true,
    // Order lifecycle (view, edit, status transitions)
    canManageOrders: true,
    // Customers & leads
    canManageCustomers: true, canViewCustomers: true,
    // Vehicles & inventory
    canManageVehicles: true, canViewVehicles: true,
    canManageInventory: true,
    // Workshop / service / job cards / QC
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canViewJobCards: true, canManageJobCards: true,
    canManageBays: true, canManageTechnicians: true,
    canPerformQC: true, canManagePartsIssue: true,
    // Spare parts
    canManageSpareParts: true, canViewSpareParts: true, canManageParts: true,
    // Warranty
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true,
    // Test drives
    canManageTestDrives: true, canViewTestDrives: true,
    // Dealers
    canManageDealers: true, canViewDealers: true,
    // CRM & post-sales
    canManageShowroomVisits: true, canManageReviews: true,
    // The Reviews nav item and backend enforcement actually key off
    // canModerateReviews, not canManageReviews — without this Manager could
    // never see/open the Reviews module despite canManageReviews being true.
    canModerateReviews: true, canViewReviews: true,
    // Content & marketing
    canManageContent: true, canManageNews: true, canManagePromotions: true,
    // Messages
    canManageMessages: true, canViewMessages: true,
    // Analytics & reports
    canViewAnalytics: true, canViewReports: true, canExportReports: true,
    canViewExecutiveDashboards: true,
    // Purchases
    canManagePurchases: true,
    // Permissions NOT granted: finance, settings, signatures, site nav, roles
  },

  // ── Sales Manager: manages sales team, approves quotations, countersigns agreements ──
  sales_manager: {
    ...defaultPermissions,
    // Quotation workflow
    canManageQuotations: true, canViewQuotations: true,
    canCountersignAgreements: true,
    // Order lifecycle
    canManageOrders: true,
    // Customers
    canManageCustomers: true, canViewCustomers: true,
    // Vehicles (view stock for allocation)
    canManageVehicles: true, canViewVehicles: true,
    // Test drives
    canManageTestDrives: true, canViewTestDrives: true,
    // Dealers
    canManageDealers: true, canViewDealers: true,
    // Showroom
    canManageShowroomVisits: true,
    // Analytics
    canViewAnalytics: true, canViewReports: true, canExportReports: true,
    canViewExecutiveDashboards: true,
    // Purchases
    canManagePurchases: true,
    // Messages
    canManageMessages: true, canViewMessages: true,
  },

  // ── Sales: creates quotations, manages orders, sends agreements ──
  sales: {
    ...defaultPermissions,
    // Quotation workflow (create, edit, submit to manager, send to customer)
    canManageQuotations: true, canViewQuotations: true,
    // Order lifecycle (view, edit fields, send agreement)
    canManageOrders: true,
    // Customers
    canManageCustomers: true, canViewCustomers: true,
    // Vehicles (view stock for allocation reference)
    canViewVehicles: true, canManageVehicles: true,
    // Test drives
    canManageTestDrives: true, canViewTestDrives: true,
    // Showroom
    canManageShowroomVisits: true,
    // Analytics (own performance)
    canViewAnalytics: true,
    // Messages
    canManageMessages: true, canViewMessages: true,
  },

  // ── Sales Representative: same as sales (alias) ──
  sales_representative: {
    ...defaultPermissions,
    canManageQuotations: true, canViewQuotations: true,
    canManageOrders: true,
    canManageCustomers: true, canViewCustomers: true,
    canViewVehicles: true, canManageVehicles: true,
    canManageTestDrives: true, canViewTestDrives: true,
    canManageShowroomVisits: true,
    canViewAnalytics: true,
    canManageMessages: true, canViewMessages: true,
  },

  // ── After Sales Manager: workshop, service, warranty, complaints ──
  after_sales_manager: {
    ...defaultPermissions,
    // Workshop / service
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canViewJobCards: true, canManageJobCards: true,
    canManageBays: true, canManageTechnicians: true,
    canPerformQC: true, canManagePartsIssue: true,
    // Spare parts
    canManageSpareParts: true, canViewSpareParts: true, canManageParts: true,
    canManageInventory: true,
    // Warranty
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true,
    // Customers (for complaints, service history)
    canManageCustomers: true, canViewCustomers: true,
    // Messages
    canManageMessages: true, canViewMessages: true,
    // Analytics
    canViewAnalytics: true, canViewReports: true, canExportReports: true,
    canViewExecutiveDashboards: true,
  },

  // ── Service Manager: manages workshop operations ──
  service_manager: {
    ...defaultPermissions,
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canViewJobCards: true, canManageJobCards: true,
    canManageBays: true, canManageTechnicians: true,
    canPerformQC: true, canManagePartsIssue: true,
    canManageSpareParts: true, canViewSpareParts: true, canManageParts: true,
    canManageInventory: true,
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true,
    canViewAnalytics: true, canViewReports: true,
    canViewExecutiveDashboards: true,
  },

  // ── Workshop Manager: day-to-day workshop operations ──
  workshop_manager: {
    ...defaultPermissions,
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canViewJobCards: true, canManageJobCards: true,
    canManageBays: true, canManageTechnicians: true,
    canPerformQC: true, canManagePartsIssue: true,
    canManageSpareParts: true, canViewSpareParts: true, canManageParts: true,
    canManageInventory: true,
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true,
    canViewAnalytics: true,
    canViewExecutiveDashboards: true,
  },

  // ── Service: technician-level workshop access ──
  service: {
    ...defaultPermissions,
    canManageWorkshop: true, canManageService: true, canManageServiceBookings: true,
    canViewJobCards: true, canManageJobCards: true,
    canManageBays: true, canManageTechnicians: true,
    canPerformQC: true, canManagePartsIssue: true,
    canManageSpareParts: true, canViewSpareParts: true, canManageParts: true,
    canManageInventory: true,
    canManageWarrantyClaims: true, canApproveWarrantyClaims: true,
  },

  // ── Service Advisor: customer-facing service role ──
  service_advisor: {
    ...defaultPermissions,
    canViewJobCards: true, canManageJobCards: true,
    canManageServiceBookings: true, canViewServiceBookings: true,
    canManageTestDrives: true, canViewTestDrives: true,
    canViewVehicles: true, canViewCustomers: true, canManageCustomers: true,
    canManageMessages: true, canViewMessages: true,
    canViewQuotations: true,
  },

  // ── Reception / Customer Attendant: front desk — registers walk-in
  //    visitors, looks up customers, books test drives, checks the day's
  //    showroom visits. No quotation/order/price access. ──
  reception: {
    ...defaultPermissions,
    canViewVehicles: true,
    canManageTestDrives: true, canViewTestDrives: true,
    canManageCustomers: true, canViewCustomers: true,
    canManageShowroomVisits: true,
  },

  // ── Marketing: content, promotions, reviews, news ──
  marketing: {
    ...defaultPermissions,
    canManageContent: true, canViewContent: true,
    canManagePromotions: true, canViewPromotions: true,
    canManageNews: true, canViewNews: true,
    // Same canManageReviews/canModerateReviews mismatch as Manager (see
    // above) — Marketing's own role description explicitly includes
    // reviews, but without canModerateReviews it couldn't open the module.
    canManageReviews: true, canModerateReviews: true, canViewReviews: true,
    canViewAnalytics: true, canViewVehicles: true, canViewDealers: true,
  },

  // ── Viewer: read-only dashboard access ──
  viewer: {
    ...defaultPermissions,
    canViewAnalytics: true, canViewReports: true, canViewVehicles: true,
    canViewQuotations: true, canViewDealers: true, canViewTestDrives: true,
    canViewMessages: true, canViewReviews: true, canViewNews: true,
    canViewSpareParts: true, canViewServiceBookings: true, canViewCustomers: true,
  },

  // ── Customer / Dealer: no admin permissions (public portal only) ──
  customer: { ...defaultPermissions },
  dealer: { ...defaultPermissions },
};

export const ADMIN_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER,
  AdminRole.SALES, AdminRole.SERVICE, AdminRole.MARKETING,
  AdminRole.SERVICE_ADVISOR, AdminRole.SERVICE_MANAGER,
  AdminRole.GM_GEELY, AdminRole.SALES_MANAGER,
  AdminRole.AFTER_SALES_MANAGER, AdminRole.SALES_REPRESENTATIVE,
  AdminRole.WORKSHOP_MANAGER, AdminRole.RECEPTION,
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
    reception: 'Customer Attendant',
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
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access — settings, roles, all modules' },
  { value: 'admin', label: 'Admin', description: 'Full admin access — manages everything' },
  { value: 'gm_geely', label: 'GM Geely', description: 'General Manager — full oversight all departments' },
  { value: 'manager', label: 'Manager', description: 'Department head — approves quotations, agreements, delivery' },
  { value: 'sales_manager', label: 'Sales Manager', description: 'Sales head — manages team, approves/countersigns sales docs' },
  { value: 'sales', label: 'Sales Agent', description: 'Creates quotations, manages orders, sends agreements' },
  { value: 'sales_representative', label: 'Sales Representative', description: 'Sales rep — same as Sales Agent role' },
  { value: 'after_sales_manager', label: 'After Sales Manager', description: 'After-sales head — workshop, service, warranty, complaints' },
  { value: 'service_manager', label: 'Service Manager', description: 'Service head — workshop operations, parts, warranty claims' },
  { value: 'workshop_manager', label: 'Workshop Manager', description: 'Workshop floor — job cards, bays, technicians, QC' },
  { value: 'service', label: 'Service Technician', description: 'Performs PDI, repairs, quality checks, warranty work' },
  { value: 'service_advisor', label: 'Service Advisor', description: 'Customer-facing — service bookings, communication, job cards' },
  { value: 'reception', label: 'Customer Attendant', description: 'Front desk — walk-in registration, customer lookup, test drives, showroom visits' },
  { value: 'marketing', label: 'Marketing', description: 'Content, promotions, news, reviews management' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only — can view analytics, reports, and all data' },
];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Full system access — can manage settings, roles, and all modules',
  admin: 'Full administrative access — can manage everything except role creation',
  manager: 'Department head — approves quotations, agreements, delivery; manages workshop & service',
  sales: 'Sales agent — creates quotations, manages orders, sends agreements to customers',
  service: 'Technician — performs PDI, workshop repairs, quality checks, warranty work',
  marketing: 'Marketing team — manages content, promotions, news, reviews',
  service_advisor: 'Service advisor — manages service bookings, customer communication, job cards',
  reception: 'Customer attendant — registers walk-in visitors, looks up customers, books test drives, checks showroom visits',
  service_manager: 'Service department head — manages workshop operations, parts, warranty claims',
  gm_geely: 'General Manager — full oversight of all departments and operations',
  sales_manager: 'Sales department head — manages sales team, approves/ countersigns quotations & agreements',
  after_sales_manager: 'After-sales head — manages workshop, service, warranty, complaints, customer retention',
  sales_representative: 'Sales rep — same as sales role (alias for finer team structure)',
  workshop_manager: 'Workshop floor manager — manages job cards, bays, technicians, parts, QC',
  viewer: 'Read-only dashboard access — can view analytics, reports, and all data',
};
