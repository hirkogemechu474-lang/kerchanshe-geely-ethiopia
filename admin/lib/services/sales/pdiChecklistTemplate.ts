// Default Pre-Delivery Inspection checklist (BRD FR-106: "PDI sign-off,
// fuel/charge level, accessories, documents"). Seeded onto every SalesOrder
// when it's booked — see admin/app/api/admin/quotations/[id]/convert-to-order/route.ts.
export const PDI_CHECKLIST_TEMPLATE: string[] = [
  'Exterior inspection — panel gaps, paint, glass',
  'Fuel / charge level confirmed',
  'Accessories fitted and verified against order',
  'Documents ready — registration, warranty booklet, owner manual',
  'Test drive / functional check completed',
];
