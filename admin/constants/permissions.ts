/**
 * Permission key constants — avoids magic strings across admin pages.
 */

export const PERMISSIONS = {
  // Content
  MANAGE_CONTENT:  'canManageContent',
  VIEW_CONTENT:    'canViewContent',
  // Vehicles
  MANAGE_VEHICLES: 'canManageVehicles',
  VIEW_VEHICLES:   'canViewVehicles',
  // Test drives
  MANAGE_TEST_DRIVES: 'canManageTestDrives',
  VIEW_TEST_DRIVES:   'canViewTestDrives',
  // Quotations
  MANAGE_QUOTATIONS: 'canManageQuotations',
  VIEW_QUOTATIONS:   'canViewQuotations',
  // Dealers
  MANAGE_DEALERS: 'canManageDealers',
  VIEW_DEALERS:   'canViewDealers',
  // Service
  MANAGE_SERVICE: 'canManageService',
  VIEW_SERVICE:   'canViewServiceBookings',
  // Parts
  MANAGE_PARTS: 'canManageSpareParts',
  VIEW_PARTS:   'canViewSpareParts',
  // Promotions
  MANAGE_PROMOTIONS: 'canManagePromotions',
  VIEW_PROMOTIONS:   'canViewPromotions',
  // Reviews
  MODERATE_REVIEWS: 'canModerateReviews',
  VIEW_REVIEWS:     'canViewReviews',
  // News
  MANAGE_NEWS: 'canManageNews',
  VIEW_NEWS:   'canViewNews',
  // Messages
  MANAGE_MESSAGES: 'canManageMessages',
  VIEW_MESSAGES:   'canViewMessages',
  // Analytics
  VIEW_ANALYTICS: 'canViewAnalytics',
  VIEW_REPORTS:   'canViewReports',
  EXPORT_REPORTS: 'canExportReports',
  // Users
  MANAGE_USERS: 'canManageUsers',
  VIEW_USERS:   'canViewUsers',
  // Settings
  MANAGE_SETTINGS: 'canManageSettings',
  VIEW_SETTINGS:   'canViewSettings',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
