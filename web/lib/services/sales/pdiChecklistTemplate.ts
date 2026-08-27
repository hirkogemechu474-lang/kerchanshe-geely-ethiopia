// Mirrors admin/lib/sales/pdiChecklistTemplate.ts — web can't import across the
// app boundary, so this is a deliberate parallel copy (same convention as the
// service-check-in kiosk's parallel job-card creation logic). Keep both in sync.
export const PDI_CHECKLIST_TEMPLATE: string[] = [
  'Exterior inspection — panel gaps, paint, glass',
  'Fuel / charge level confirmed',
  'Accessories fitted and verified against order',
  'Documents ready — registration, warranty booklet, owner manual',
  'Test drive / functional check completed',
];
