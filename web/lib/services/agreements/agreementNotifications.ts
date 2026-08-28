import { sendStatusEmail } from '@/lib/status-email';
import { resolveManagersForLead } from '@/lib/assignSalesRep';

// Links back into the admin app's order detail page — same convention as
// web/lib/services/quotations/leadNotifications.ts's adminQuotationUrl.
function adminOrderUrl(orderId: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_ADMIN_API_URL;
  return base ? `${base.replace(/\/$/, '')}/admin/orders/${orderId}` : undefined;
}

// Notifies sales managers once a customer has e-signed/attached the sales
// agreement, so the "Awaiting sales manager countersignature" step (see
// admin/components/admin/sales/OrderApprovalPanel.tsx) doesn't rely on a
// manager stumbling onto it — mirrors notifyManagersOfNewLead's shape.
// Best-effort: never throws, never blocks the signing flow.
export async function notifyManagersOfSignedAgreement(order: {
  id: string;
  orderNo: string;
  customerName: string;
  vehicleModel: string;
}): Promise<void> {
  try {
    const managers = await resolveManagersForLead();
    if (managers.length === 0) return;

    const details = [
      `Customer: ${order.customerName}`,
      `Vehicle: ${order.vehicleModel}`,
      `Order: ${order.orderNo}`,
    ].join('\n');

    await Promise.allSettled(
      managers.map((manager) =>
        sendStatusEmail({
          to: manager.email,
          name: manager.name,
          entityType: 'sales agreement',
          status: 'awaiting countersignature',
          reference: order.orderNo,
          details,
          actionUrl: adminOrderUrl(order.id),
          actionLabel: 'Review & Countersign',
        })
      )
    );
  } catch (error) {
    console.error('[agreement:notify-managers]', error);
  }
}
