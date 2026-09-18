export interface PdiChecklistItem {
  id: string;
  category: string;
  label: string;
  description?: string;
}

export const PDI_CHECKLIST_TEMPLATE: PdiChecklistItem[] = [
  { id: 'ext-001', category: 'Exterior', label: 'Body panels - no dents or scratches' },
  { id: 'ext-002', category: 'Exterior', label: 'Paint condition - no defects' },
  { id: 'ext-003', category: 'Exterior', label: 'All lights functioning' },
  { id: 'ext-004', category: 'Exterior', label: 'Windshield - no cracks' },
  { id: 'ext-005', category: 'Exterior', label: 'Tires - proper inflation and tread' },
  { id: 'ext-006', category: 'Exterior', label: 'All mirrors intact and adjusted' },
  { id: 'int-001', category: 'Interior', label: 'Seats - no tears or stains' },
  { id: 'int-002', category: 'Interior', label: 'Dashboard - no warning lights' },
  { id: 'int-003', category: 'Interior', label: 'AC/Heating system functional' },
  { id: 'int-004', category: 'Interior', label: 'Audio system functional' },
  { id: 'int-005', category: 'Interior', label: 'All windows operational' },
  { id: 'int-006', category: 'Interior', label: 'Floor mats present' },
  { id: 'mech-001', category: 'Mechanical', label: 'Engine oil level correct' },
  { id: 'mech-002', category: 'Mechanical', label: 'Coolant level correct' },
  { id: 'mech-003', category: 'Mechanical', label: 'Brake fluid level correct' },
  { id: 'mech-004', category: 'Mechanical', label: 'Battery terminals clean' },
  { id: 'mech-005', category: 'Mechanical', label: 'No unusual noises from engine' },
  { id: 'doc-001', category: 'Documentation', label: 'Owner manual present' },
  { id: 'doc-002', category: 'Documentation', label: 'Spare key provided' },
  { id: 'doc-003', category: 'Documentation', label: 'Service booklet provided' },
  { id: 'doc-004', category: 'Documentation', label: 'Warranty card provided' },
];

export function getPdiChecklist(): PdiChecklistItem[] {
  return PDI_CHECKLIST_TEMPLATE;
}

export function getPdiCategories(): string[] {
  return [...new Set(PDI_CHECKLIST_TEMPLATE.map((item) => item.category))];
}

// Seeds the PDI checklist once a vehicle is actually allocated to the order
// (vehicleAllocationService.lockAllocation's RESERVED -> ALLOCATED step) —
// per the spec's step order, inspection only makes sense once a specific VIN
// is locked in, not at order creation before any vehicle is even chosen. The
// BOOKED -> READY_FOR_DELIVERY gate (order.service.ts's
// getTransitionBlockReason) requires `pdiItems.length > 0 && every(isChecked)`
// AND vehicleAllocation.status === 'ALLOCATED' before that transition, so by
// the time PDI completeness is ever checked, allocation has already
// happened and this has already run. Idempotent (checks for existing rows
// first) since lockAllocation can be called again for an already-ALLOCATED
// order.
export async function seedPdiChecklist(
  prisma: { pdiChecklistItem: { createMany: (args: any) => Promise<unknown>; count: (args: any) => Promise<number> } },
  orderId: string
): Promise<void> {
  const existingCount = await prisma.pdiChecklistItem.count({ where: { orderId } });
  if (existingCount > 0) return;
  await prisma.pdiChecklistItem.createMany({
    data: PDI_CHECKLIST_TEMPLATE.map((item) => ({
      orderId,
      label: `${item.category}: ${item.label}`,
    })),
  });
}
