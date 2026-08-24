// Unified customer-facing reference number for quotes, purchases, service
// bookings, financing applications, parts requests, and CRM leads —
// KER-GLY-DD-MM-YYYY-XXXX. The date makes it human-readable at a glance; the
// random suffix keeps same-day requests unique.
export function generateReference(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const code = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `KER-GLY-${dd}-${mm}-${now.getFullYear()}-${code}`;
}
