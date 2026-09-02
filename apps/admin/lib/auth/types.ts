export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'sales' | 'service' | 'viewer';

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageVehicles: boolean;
  canManageOrders: boolean;
  canManageCustomers: boolean;
  canManageInventory: boolean;
  canManageWorkshop: boolean;
  canManageFinance: boolean;
  canManageContent: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canManageDealers: boolean;
  canManageTestDrives: boolean;
  canManageServiceBookings: boolean;
  canManageParts: boolean;
  canManageReviews: boolean;
  canManageNews: boolean;
  canManagePromotions: boolean;
  canViewJobCards: boolean;
  canManageJobCards: boolean;
  canManageQuotations: boolean;
  canManagePurchases: boolean;
  canManageSignatures: boolean;
  canManageShowroomVisits: boolean;
  canManageSiteNavigation: boolean;
  canViewCustomers: boolean;
  canManageMessages: boolean;
  canManageRoles: boolean;
  canViewVehicles: boolean;
  canManageWarrantyClaims: boolean;
  canManageBays: boolean;
  canManageTechnicians: boolean;
  canManageService: boolean;
  canManageSpareParts: boolean;
  canViewSpareParts: boolean;
  canViewQuotations: boolean;
  canViewDealers: boolean;
  canViewTestDrives: boolean;
  canViewMessages: boolean;
  canViewReports: boolean;
  canCountersignAgreements: boolean;
  canApproveWarrantyClaims: boolean;
  canPerformQC: boolean;
  canManagePartsIssue: boolean;
  canExportReports: boolean;
}

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    canManageUsers: true, canManageVehicles: true, canManageOrders: true,
    canManageCustomers: true, canManageInventory: true, canManageWorkshop: true,
    canManageFinance: true, canManageContent: true, canViewAnalytics: true,
    canManageSettings: true, canManageDealers: true, canManageTestDrives: true,
    canManageServiceBookings: true, canManageParts: true, canManageReviews: true,
    canManageNews: true, canManagePromotions: true, canViewJobCards: true,
    canManageJobCards: true, canManageQuotations: true, canManagePurchases: true,
    canManageSignatures: true, canManageShowroomVisits: true, canManageSiteNavigation: true,
    canViewCustomers: true, canManageMessages: true, canManageRoles: true,
    canViewVehicles: true, canManageWarrantyClaims: true, canManageBays: true,
    canManageTechnicians: true, canManageService: true, canManageSpareParts: true,
    canViewSpareParts: true, canViewQuotations: true, canViewDealers: true,
    canViewTestDrives: true, canViewMessages: true, canViewReports: true,
    canCountersignAgreements: true, canApproveWarrantyClaims: true, canPerformQC: true,
    canManagePartsIssue: true, canExportReports: true,
  },
  admin: {
    canManageUsers: true, canManageVehicles: true, canManageOrders: true,
    canManageCustomers: true, canManageInventory: true, canManageWorkshop: true,
    canManageFinance: true, canManageContent: true, canViewAnalytics: true,
    canManageSettings: true, canManageDealers: true, canManageTestDrives: true,
    canManageServiceBookings: true, canManageParts: true, canManageReviews: true,
    canManageNews: true, canManagePromotions: true, canViewJobCards: true,
    canManageJobCards: true, canManageQuotations: true, canManagePurchases: true,
    canManageSignatures: true, canManageShowroomVisits: true, canManageSiteNavigation: true,
    canViewCustomers: true, canManageMessages: true, canManageRoles: true,
    canViewVehicles: true, canManageWarrantyClaims: true, canManageBays: true,
    canManageTechnicians: true, canManageService: true, canManageSpareParts: true,
    canViewSpareParts: true, canViewQuotations: true, canViewDealers: true,
    canViewTestDrives: true, canViewMessages: true, canViewReports: true,
    canCountersignAgreements: true, canApproveWarrantyClaims: true, canPerformQC: true,
    canManagePartsIssue: true, canExportReports: true,
  },
  manager: {
    canManageUsers: false, canManageVehicles: true, canManageOrders: true,
    canManageCustomers: true, canManageInventory: true, canManageWorkshop: true,
    canManageFinance: false, canManageContent: true, canViewAnalytics: true,
    canManageSettings: false, canManageDealers: true, canManageTestDrives: true,
    canManageServiceBookings: true, canManageParts: true, canManageReviews: true,
    canManageNews: true, canManagePromotions: true, canViewJobCards: true,
    canManageJobCards: true, canManageQuotations: true, canManagePurchases: true,
    canManageSignatures: false, canManageShowroomVisits: true, canManageSiteNavigation: false,
    canViewCustomers: true, canManageMessages: true, canManageRoles: false,
    canViewVehicles: true, canManageWarrantyClaims: true, canManageBays: true,
    canManageTechnicians: true, canManageService: true, canManageSpareParts: true,
    canViewSpareParts: true, canViewQuotations: true, canViewDealers: true,
    canViewTestDrives: true, canViewMessages: true, canViewReports: true,
  },
  sales: {
    canManageUsers: false, canManageVehicles: false, canManageOrders: true,
    canManageCustomers: true, canManageInventory: false, canManageWorkshop: false,
    canManageFinance: false, canManageContent: false, canViewAnalytics: true,
    canManageSettings: false, canManageDealers: false, canManageTestDrives: true,
    canManageServiceBookings: false, canManageParts: false, canManageReviews: false,
    canManageNews: false, canManagePromotions: false, canViewJobCards: false,
    canManageJobCards: false, canManageQuotations: true, canManagePurchases: false,
    canManageSignatures: false, canManageShowroomVisits: true, canManageSiteNavigation: false,
    canViewCustomers: true, canManageMessages: false, canManageRoles: false,
    canViewVehicles: true, canManageWarrantyClaims: false, canManageBays: false,
    canManageTechnicians: false, canManageService: false, canManageSpareParts: false,
    canViewSpareParts: false, canViewQuotations: true, canViewDealers: false,
    canViewTestDrives: true, canViewMessages: false, canViewReports: false,
  },
  service: {
    canManageUsers: false, canManageVehicles: false, canManageOrders: false,
    canManageCustomers: false, canManageInventory: true, canManageWorkshop: true,
    canManageFinance: false, canManageContent: false, canViewAnalytics: false,
    canManageSettings: false, canManageDealers: false, canManageTestDrives: false,
    canManageServiceBookings: true, canManageParts: true, canManageReviews: false,
    canManageNews: false, canManagePromotions: false, canViewJobCards: true,
    canManageJobCards: true, canManageQuotations: false, canManagePurchases: false,
    canManageSignatures: false, canManageShowroomVisits: false, canManageSiteNavigation: false,
    canViewCustomers: false, canManageMessages: false, canManageRoles: false,
    canViewVehicles: false, canManageWarrantyClaims: true, canManageBays: true,
    canManageTechnicians: true, canManageService: true, canManageSpareParts: true,
    canViewSpareParts: true, canViewQuotations: false, canViewDealers: false,
    canViewTestDrives: false, canViewMessages: false, canViewReports: false,
  },
  viewer: {
    canManageUsers: false, canManageVehicles: false, canManageOrders: false,
    canManageCustomers: false, canManageInventory: false, canManageWorkshop: false,
    canManageFinance: false, canManageContent: false, canViewAnalytics: true,
    canManageSettings: false, canManageDealers: false, canManageTestDrives: false,
    canManageServiceBookings: false, canManageParts: false, canManageReviews: false,
    canManageNews: false, canManagePromotions: false, canViewJobCards: false,
    canManageJobCards: false, canManageQuotations: false, canManagePurchases: false,
    canManageSignatures: false, canManageShowroomVisits: false, canManageSiteNavigation: false,
    canViewCustomers: false, canManageMessages: false, canManageRoles: false,
    canViewVehicles: false, canManageWarrantyClaims: false, canManageBays: false,
    canManageTechnicians: false, canManageService: false, canManageSpareParts: false,
    canViewSpareParts: false, canViewQuotations: false, canViewDealers: false,
    canViewTestDrives: false, canViewMessages: false, canViewReports: true,
  },
};

export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'manager', 'sales', 'service', 'viewer'];
