// Printable job-title fallback for a signer whose User.title hasn't been
// filled in (see EditUserForm.tsx / the admin Profile page's "Job title"
// field) — every signature block on a sales document (quotation, agreement,
// invoice, handover) prints Name/Title/Signature/Date, and a blank Title
// line looks unfinished on a document a customer signs. Distinct from
// ROLE_OPTIONS in apps/admin/lib/auth/types.ts (that list's labels are for
// an internal admin dropdown, e.g. "Sales Agent", "GM Geely" — these are
// worded for a formal printed document instead, e.g. "Sales Executive",
// "General Manager"). Mirrors the same role slugs as VALID_STAFF_ROLES in
// users.routes.ts — no shared module path into apps/admin exists, so update
// both places together if a role is added.
const PRINTABLE_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Administrator',
  admin: 'Administrator',
  gm_geely: 'General Manager',
  manager: 'Manager',
  sales_manager: 'Sales Manager',
  sales: 'Sales Executive',
  sales_representative: 'Sales Executive',
  after_sales_manager: 'After-Sales Manager',
  service_manager: 'Service Manager',
  workshop_manager: 'Workshop Manager',
  service: 'Service Technician',
  service_advisor: 'Service Advisor',
  marketing: 'Marketing',
  viewer: 'Viewer',
};

export function roleLabel(role: string | null | undefined): string | null {
  if (!role) return null;
  return PRINTABLE_ROLE_LABELS[role] || null;
}

// Same manager-tier set as MANAGER_ROLES in apps/admin/lib/assignSalesRep.ts
// — a quotation's printed "Sales executive" must default to a manager, never
// a plain sales agent, even if the field's stored value is a stale name left
// over from before that rule existed (see quotationPdf.service.ts).
const MANAGER_TIER_ROLES = new Set(['sales_manager', 'general_manager', 'admin', 'super_admin']);

export function isManagerRole(role: string | null | undefined): boolean {
  return !!role && MANAGER_TIER_ROLES.has(role);
}
