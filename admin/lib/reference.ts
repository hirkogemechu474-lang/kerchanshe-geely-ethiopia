import { prisma } from './prisma';

// Unified reference number for quotes, purchases, service bookings,
// financing applications, parts requests, CRM leads, and the formal Sales
// Quotation PDF number — GY-SQ-DDMMYYYY-NNN. NNN is a daily sequence (via
// the shared Counter model, one counter per calendar day) rather than a
// random code, so same-day references stay unique and sequential. Mirrored
// in web/lib/reference.ts (web/admin can't share modules across the app
// boundary) — both draw from the same Counter row, since they point at the
// same database, so numbers issued by either app never collide.
export async function generateReference(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd}${mm}${yyyy}`;
  const counter = await prisma.counter.upsert({
    where: { name: `reference-${dateStr}` },
    create: { name: `reference-${dateStr}`, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `GY-SQ-${dateStr}-${String(counter.value).padStart(3, '0')}`;
}
