/**
 * Admin-panel domain types.
 * Auth types (AdminRole, AdminPermissions) live in lib/auth/types.ts.
 * This file holds page-level and UI types.
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: Record<string, boolean>;
  dealerId?: string;
}

export interface DashboardStats {
  totalVehicles: number;
  totalTestDrives: number;
  totalQuotations: number;
  totalMessages: number;
  totalDealers: number;
  pendingTestDrives: number;
  pendingQuotations: number;
  unreadMessages: number;
}

export interface AdminTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface AdminTableState {
  page: number;
  pageSize: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
}

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}
