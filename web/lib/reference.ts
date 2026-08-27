import { prisma } from './prisma';

// Unified reference number format: GY-<CATEGORY>-DDMMYYYY-NNN. NNN is a
// daily-per-category sequence (via the shared Counter model — one counter
// per calendar day per category) rather than a random code, so same-day
// references within a category stay unique and sequential. Mirrored in
// admin/lib/reference.ts (web/admin can't share modules across the app
// boundary) — both draw from the same Counter rows, since they point at
// the same database, so numbers issued by either app never collide.
//
// Every reference previously used the same GY-SQ- prefix regardless of
// what it actually was (a test drive, a trade-in, a parts request all
// looked like a "Sales Quotation") — REFERENCE_CATEGORY below is the
// single source of truth callers should pick from, so the prefix actually
// reflects the kind of record it's attached to.
export const REFERENCE_CATEGORY = {
  QUOTATION: 'SQ', // Formal/general sales quotation (Quotation model)
  TEST_DRIVE: 'TD', // TestDrive model
  TRADE_IN: 'TI', // Trade-in request (Message, category "Trade-In")
  SERVICE_BOOKING: 'SB', // ServiceBooking model
  SERVICE_INQUIRY: 'SI', // Generic service enquiry (Message, category "service")
  CONTACT: 'CT', // Generic contact enquiry (Message, category "contact")
  FINANCING: 'FA', // Financing application (Message, category "Financing")
  PARTS_REQUEST: 'PR', // PartRequest model
  PURCHASE: 'PU', // Direct vehicle purchase (Quotation + SalesOrder)
  SHOWROOM_VISIT: 'SV', // Showroom QR walk-in (not persisted against a record)
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
