import type { AdminRole } from './types';

export const PERMISSION_GROUPS: Record<string, { label: string; permissions: string[] }> = {
  users: { label: 'User Management', permissions: ['canManageUsers'] },
  vehicles: { label: 'Vehicle Management', permissions: ['canManageVehicles'] },
  orders: { label: 'Order Management', permissions: ['canManageOrders'] },
  customers: { label: 'Customer Management', permissions: ['canManageCustomers'] },
  inventory: { label: 'Inventory Management', permissions: ['canManageInventory'] },
  workshop: { label: 'Workshop Management', permissions: ['canManageWorkshop'] },
  finance: { label: 'Finance Management', permissions: ['canManageFinance'] },
  content: { label: 'Content Management', permissions: ['canManageContent'] },
  analytics: { label: 'Analytics', permissions: ['canViewAnalytics'] },
  settings: { label: 'Settings', permissions: ['canManageSettings'] },
  dealers: { label: 'Dealer Management', permissions: ['canManageDealers'] },
  testDrives: { label: 'Test Drive Management', permissions: ['canManageTestDrives'] },
  serviceBookings: { label: 'Service Booking Management', permissions: ['canManageServiceBookings'] },
  parts: { label: 'Parts Management', permissions: ['canManageParts'] },
  reviews: { label: 'Review Management', permissions: ['canManageReviews'] },
  news: { label: 'News Management', permissions: ['canManageNews'] },
  promotions: { label: 'Promotion Management', permissions: ['canManagePromotions'] },
};

export function roleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    manager: 'Manager',
    sales: 'Sales',
    service: 'Service',
    viewer: 'Viewer',
  };
  return labels[role] || role;
}
