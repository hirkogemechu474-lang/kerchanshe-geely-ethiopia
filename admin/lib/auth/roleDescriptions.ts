import { AdminRole, ADMIN_ROLES } from './types';
import { roleLabel } from './permissionGroups';

// One-line description shown next to each role in the New/Edit User role
// picker. Optional per role — ADMIN_ROLES (the actual source of truth for
// "which roles exist") is what drives the dropdown's option list, this is
// just supplementary text, so a role with no entry here still gets a
// usable option instead of silently disappearing from the form.
const ROLE_DESCRIPTIONS: Partial<Record<AdminRole, string>> = {
  [AdminRole.SUPER_ADMIN]: 'Full system access',
  [AdminRole.ADMIN]: 'Full operational access',
  [AdminRole.MANAGER]: 'Manage most operations',
  [AdminRole.SALES]: 'Handle sales & quotations',
  [AdminRole.SERVICE]: 'Manage service bookings',
  [AdminRole.MARKETING]: 'Content & promotions',
  [AdminRole.SERVICE_ADVISOR]: 'Job cards & write-up',
  [AdminRole.SERVICE_MANAGER]: 'Workshop, bays & QC',
  [AdminRole.GM_GEELY]: 'Cross-department oversight',
  [AdminRole.SALES_MANAGER]: 'Oversees sales reps',
  [AdminRole.AFTER_SALES_MANAGER]: 'Workshop, parts & warranty',
  [AdminRole.SALES_REPRESENTATIVE]: 'Quotations & test drives',
  [AdminRole.WORKSHOP_MANAGER]: 'Bays, technicians & QC',
};

export function roleOptionLabel(role: AdminRole): string {
  const description = ROLE_DESCRIPTIONS[role];
  return description ? `${roleLabel(role)} - ${description}` : roleLabel(role);
}

// The role <select> options both NewUserForm and EditUserForm should
// render — every admin-panel role, not a manually-maintained subset that
// silently drifts out of sync with ADMIN_ROLES (this list was previously
// hardcoded separately in each form and had fallen out of sync with it —
// EditUserForm was missing 6 of 13 roles, NewUserForm 1 of 13).
export const ROLE_OPTIONS = ADMIN_ROLES.map((role) => ({ value: role, label: roleOptionLabel(role) }));
