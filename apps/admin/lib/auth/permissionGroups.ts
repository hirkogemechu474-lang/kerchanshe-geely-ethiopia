import type { AdminRole } from './types';

export const PERMISSION_GROUPS = {
  users: { label: 'User Management', permissions: ['canManageUsers', 'canViewUsers', 'canManageRoles'] },
  vehicles: { label: 'Vehicle Management', permissions: ['canManageVehicles', 'canViewVehicles'] },
  orders: { label: 'Order Management', permissions: ['canManageOrders', 'canManagePurchases', 'canManageQuotations', 'canViewQuotations', 'canCountersignAgreements', 'canManageShowroomVisits'] },
  customers: { label: 'Customer Management', permissions: ['canManageCustomers', 'canViewCustomers'] },
  inventory: { label: 'Inventory Management', permissions: ['canManageInventory', 'canManageWorkshop', 'canManageSpareParts', 'canViewSpareParts'] },
  workshop: { label: 'Workshop Management', permissions: ['canManageWorkshop', 'canViewJobCards', 'canManageJobCards', 'canManageBays', 'canManageTechnicians', 'canPerformQC', 'canManagePartsIssue', 'canManageWarrantyClaims', 'canApproveWarrantyClaims'] },
  finance: { label: 'Finance Management', permissions: ['canManageFinance', 'canManagePurchases'] },
  content: { label: 'Content Management', permissions: ['canManageContent', 'canViewContent', 'canManagePromotions', 'canViewPromotions', 'canModerateReviews', 'canViewReviews', 'canManageNews', 'canViewNews'] },
  analytics: { label: 'Analytics', permissions: ['canViewAnalytics', 'canExportReports', 'canViewReports', 'canViewExecutiveDashboards'] },
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
  return labels[role] || role;
}
