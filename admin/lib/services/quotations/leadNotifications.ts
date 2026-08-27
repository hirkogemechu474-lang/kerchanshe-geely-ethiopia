import type { Quotation } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendStatusEmail } from '@/lib/status-email';
import { resolveManagersForLead } from '@/lib/assignSalesRep';

// Self-referencing link back into this app's own quotation detail page.
function adminQuotationUrl(quotationId: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_ADMIN_URL;
  return base ? `${base.replace(/\/$/, '')}/admin/quotations/${quotationId}` : undefined;
}

function quotationDetails(quotation: Quotation): string {
  return [
    `Customer: ${quotation.customerName}`,
    `Phone: ${quotation.phoneNumber}`,
    quotation.email ? `Email: ${quotation.email}` : '',
    `Vehicle: ${quotation.vehicleModel || 'General enquiry'}`,
    quotation.message ? `Message: ${quotation.message}` : '',
  ].filter(Boolean).join('\n');
}

// Notifies sales managers (dealer-scoped when resolvable, else all active
// sales_manager users) that a new lead came in. Best-effort: never throws,
// never blocks the quotation write, one bad recipient never blocks another.
export async function notifyManagersOfNewLead(
  quotation: Quotation,
  assignedRepName: string | null
): Promise<void> {
  try {
    const managers = await resolveManagersForLead(quotation.preferredDealer);
    if (managers.length === 0) return;

    const details = [
      quotationDetails(quotation),
      quotation.preferredDealer ? `Preferred dealer: ${quotation.preferredDealer}` : '',
      `Assigned to: ${assignedRepName || 'Unassigned'}`,
    ].filter(Boolean).join('\n');

    await Promise.allSettled(
      managers.map((manager) =>
        sendStatusEmail({
          to: manager.email,
          name: manager.name,
          entityType: 'new sales lead',
          status: 'received',
          reference: quotation.reference || quotation.id,
          details,
          actionUrl: adminQuotationUrl(quotation.id),
          actionLabel: 'View Lead in Admin',
        })
      )
    );
  } catch (error) {
    console.error('[quotations:notify-managers]', error);
  }
}

// Notifies the sales rep a lead was assigned to (auto-assignment or manual
// reassignment) so they know to follow up. Best-effort, same as above.
export async function notifyAssignedRep(quotation: Quotation, repId: string | null): Promise<void> {
  if (!repId) return;
  try {
    const rep = await prisma.user.findUnique({ where: { id: repId }, select: { name: true, email: true } });
    if (!rep?.email) return;

    await sendStatusEmail({
      to: rep.email,
      name: rep.name,
      entityType: 'customer assignment',
      status: 'assigned',
      reference: quotation.reference || quotation.id,
      details: quotationDetails(quotation),
      actionUrl: adminQuotationUrl(quotation.id),
      actionLabel: 'Review & Send Quotation',
    });
  } catch (error) {
    console.error('[quotations:notify-rep]', error);
  }
}
