import { prisma } from '../config/database';

export const REFERENCE_CATEGORY = {
  QUOTATION: 'SQ',
  TEST_DRIVE: 'TD',
  TRADE_IN: 'TI',
  TRADE_IN_EVALUATION: 'TIE',
  SERVICE_BOOKING: 'SB',
  SERVICE_INQUIRY: 'SI',
  CONTACT: 'CT',
  FINANCING: 'FA',
  PARTS_REQUEST: 'PR',
  PURCHASE: 'PU',
  SHOWROOM_VISIT: 'SV',
  LEAD: 'LD',
  DELIVERY: 'DN',
  PROFORMA: 'PI',
  PAYMENT: 'PY',
} as const;

export type ReferenceCategory = (typeof REFERENCE_CATEGORY)[keyof typeof REFERENCE_CATEGORY];

export async function generateReference(category: ReferenceCategory): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd}${mm}${yyyy}`;

  const counter = await prisma.counter.upsert({
    where: { name: `reference-${category}-${dateStr}` },
    create: { name: `reference-${category}-${dateStr}`, value: 1 },
    update: { value: { increment: 1 } },
  });

  return `GY-${category}-${dateStr}-${String(counter.value).padStart(3, '0')}`;
}
