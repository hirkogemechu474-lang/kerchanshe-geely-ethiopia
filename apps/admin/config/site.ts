/**
 * Admin panel static configuration.
 */

export const ADMIN_CONFIG = {
  name: 'Geely Ethiopia Admin',
  version: '2.0.0',
  defaultPageSize: 20,
  maxPageSize: 100,
  sessionMaxAge: 8 * 60 * 60, // 8 hours
} as const;

export const ADMIN_ROUTES = {
  dashboard:      '/admin/analytics',
  login:          '/admin/login',
  unauthorized:   '/admin/unauthorized',
  vehicles:       '/admin/vehicles',
  categories:     '/admin/categories',
  dealers:        '/admin/dealers',
  testDrives:     '/admin/test-drives',
  quotations:     '/admin/quotations',
  serviceBookings:'/admin/service-bookings',
  messages:       '/admin/messages',
  news:           '/admin/news',
  promotions:     '/admin/promotions',
  reviews:        '/admin/reviews',
  faq:            '/admin/faq',
  users:          '/admin/users',
  analytics:      '/admin/analytics',
  settings:       '/admin/settings',
  parts:          '/admin/parts',
  content:        '/admin/content',
} as const;
