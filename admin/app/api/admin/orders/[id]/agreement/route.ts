import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

/**
 * GET /api/admin/orders/[id]/agreement
 *
 * Renders a print-ready HTML sales agreement for a booked order — staff
 * print it (or save-as-PDF via the browser's print dialog) and send it to
 * the customer for signature. Mirrors web/app/api/vehicles/[id]/brochure's
 * "pure HTML + print CSS, zero external dependencies" pattern; there is no
 * server-side PDF generation in this codebase to reuse.
 *
 * The agreement is always rendered fresh from the order's current data
 * (no separate stored document) — it only becomes viewable once the order
 * has been approved (see POST .../approve).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.approvedAt) {
    return NextResponse.json({ error: 'This order must be approved before the agreement can be viewed.' }, { status: 409 });
  }

  const config = (order.configurationJson || {}) as Record<string, unknown>;
  const configRows: { label: string; value: string }[] = [
    ['trim', 'Trim'], ['color', 'Color'], ['wheels', 'Wheels'], ['interior', 'Interior'],
  ].map(([key, label]) => ({ label, value: typeof config[key] === 'string' ? (config[key] as string) : '' }))
    .filter((row) => row.value);
  if (Array.isArray(config.accessories) && config.accessories.length > 0) {
    configRows.push({ label: 'Accessories', value: (config.accessories as string[]).join(', ') });
  }

  const priceText = order.totalPrice != null
    ? `ETB ${order.totalPrice.toLocaleString('en-US')}`
    : 'To be confirmed';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Sales Agreement — ${order.orderNo}</title>
<style>
  @media print { @page { margin: 20mm; } }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; max-width: 720px; margin: 0 auto; padding: 32px 24px; line-height: 1.55; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .subtitle { color: #555; font-size: 13px; margin-bottom: 28px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  td { padding: 6px 0; font-size: 14px; vertical-align: top; }
  td.label { color: #555; width: 180px; }
  .section-title { font-size: 15px; font-weight: bold; margin: 24px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .terms { font-size: 12px; color: #333; }
  .terms p { margin: 0 0 10px; }
  .signatures { display: flex; gap: 40px; margin-top: 56px; }
  .sig-block { flex: 1; }
  .sig-line { border-top: 1px solid #111; margin-top: 48px; padding-top: 6px; font-size: 12px; color: #555; }
  .footer-note { margin-top: 32px; font-size: 11px; color: #888; }
</style>
</head>
<body>
  <h1>Vehicle Purchase Agreement</h1>
  <div class="subtitle">Order ${order.orderNo} — Geely Ethiopia · Kerchanshe Auto</div>

  <div class="section-title">Customer</div>
  <table>
    <tr><td class="label">Name</td><td>${order.customerName}</td></tr>
    <tr><td class="label">Phone</td><td>${order.customerPhone}</td></tr>
    ${order.customerEmail ? `<tr><td class="label">Email</td><td>${order.customerEmail}</td></tr>` : ''}
  </table>

  <div class="section-title">Vehicle</div>
  <table>
    <tr><td class="label">Model</td><td>${order.vehicleModel}</td></tr>
    ${configRows.map((row) => `<tr><td class="label">${row.label}</td><td>${row.value}</td></tr>`).join('')}
    <tr><td class="label">Total Price</td><td>${priceText}</td></tr>
    <tr><td class="label">Financing</td><td>${order.financingStatus.replace(/_/g, ' ')}</td></tr>
  </table>

  <div class="section-title">Terms</div>
  <div class="terms">
    <p>This agreement confirms the customer's order for the vehicle described above. The total price is subject to final confirmation by Geely Ethiopia's sales department and any applicable financing approval. The vehicle will be prepared for delivery following a Pre-Delivery Inspection (PDI); delivery is contingent on the signed copy of this agreement being returned to Geely Ethiopia.</p>
    <p>By signing below, the customer confirms the accuracy of the details above and their intent to purchase the described vehicle on these terms.</p>
  </div>

  <div class="signatures">
    <div class="sig-block"><div class="sig-line">Customer Signature &amp; Date</div></div>
    <div class="sig-block"><div class="sig-line">Sales Agent Signature &amp; Date</div></div>
  </div>

  <div class="footer-note">
    Approved ${new Date(order.approvedAt).toLocaleString()} · Order created ${new Date(order.orderDate).toLocaleDateString()}
  </div>

  <script>
    window.addEventListener('load', () => setTimeout(() => window.print(), 400));
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${order.orderNo}-agreement.html"`,
    },
  });
}
