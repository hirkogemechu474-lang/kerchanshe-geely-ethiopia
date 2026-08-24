import type { AdminPermissions } from './types';

// BRD §17.2 Role Permission Matrix grouping, shared by the Roles &
// Permissions viewer (app/admin/users/roles) and the role-preview shown when
// assigning a role on the user create/edit forms.
export const PERMISSION_GROUPS: { label: string; keys: { key: keyof AdminPermissions; label: string }[] }[] = [
  {
    label: 'Content Management',
    keys: [
      { key: 'canManageContent', label: 'Manage content' },
      { key: 'canManagePromotions', label: 'Manage promotions' },
      { key: 'canManageNews', label: 'Manage news' },
      { key: 'canModerateReviews', label: 'Moderate reviews' },
    ],
  },
  {
    label: 'Vehicles',
    keys: [
      { key: 'canManageVehicles', label: 'Manage vehicles' },
      { key: 'canManageDealers', label: 'Manage dealers' },
    ],
  },
  {
    label: 'SWMS — Sales',
    keys: [
      { key: 'canManageTestDrives', label: 'Manage test drives' },
      { key: 'canViewQuotations', label: 'View quote requests' },
      { key: 'canManageMessages', label: 'Manage messages' },
    ],
  },
  {
    label: 'SWMS — Service / Workshop',
    keys: [
      { key: 'canViewJobCards', label: 'View job cards' },
      { key: 'canManageJobCards', label: 'Manage job cards' },
      { key: 'canManageService', label: 'Manage service bookings' },
      { key: 'canManageBays', label: 'Manage bays' },
      { key: 'canManageTechnicians', label: 'Manage technicians' },
      { key: 'canPerformQC', label: 'Perform QC sign-off' },
      { key: 'canApproveWarrantyClaims', label: 'Approve warranty claims' },
    ],
  },
  {
    label: 'SWMS — Parts & Inventory',
    keys: [
      { key: 'canManageSpareParts', label: 'Manage spare parts' },
      { key: 'canManagePartsIssue', label: 'Issue parts at the counter' },
    ],
  },
  {
    label: 'Reporting & Admin',
    keys: [
      { key: 'canViewReports', label: 'View reports' },
      { key: 'canExportReports', label: 'Export reports' },
      { key: 'canManageUsers', label: 'Manage users' },
      { key: 'canManageSettings', label: 'Manage settings' },
    ],
  },
];

export function roleLabel(role: string) {
  if (role === 'gm_geely') return 'GM-Geely';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
