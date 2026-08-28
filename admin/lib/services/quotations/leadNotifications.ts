import type { Quotation } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { userRepository } from '@/repositories/userRepository';
import { sendStatusEmail } from '@/lib/status-email';
import { resolveManagersForLead, listSalesReps } from '@/lib/assignSalesRep';
import { getEffectivePermissionsForAdminRoles } from '@/lib/auth/rolePermissions';

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

// Notifies whoever currently holds the canCountersignAgreements permission
// (accounting for Roles & Permissions overrides, not just the hardcoded
// role defaults — see getEffectivePermissionsForAdminRoles) that a
// quotation is generated and needs their review before it can be sent.
// Fires every time a quotation lands in PENDING (fresh, or after a
// post-rejection correction) — see generateQuotationPdf. Best-effort, same
// semantics as its siblings here.
export async function notifyApproversOfPendingQuotation(quotation: Quotation): Promise<void> {
  try {
    const { effective } = await getEffectivePermissionsForAdminRoles();
    const approverRoles = Object.entries(effective)
      .filter(([, perms]) => perms.canCountersignAgreements)
      .map(([role]) => role);
    if (approverRoles.length === 0) return;

    const approvers = await userRepository.findManyByRoles(approverRoles);
    if (approvers.length === 0) return;

    const details = [
      quotationDetails(quotation),
      quotation.quotationNo ? `Quotation number: ${quotation.quotationNo}` : '',
    ].filter(Boolean).join('\n');

    await Promise.allSettled(
      approvers.map((approver) =>
        sendStatusEmail({
          to: approver.email,
          name: approver.name,
          entityType: 'sales quotation',
          status: 'awaiting approval',
          reference: quotation.reference || quotation.quotationNo || quotation.id,
          details,
          actionUrl: adminQuotationUrl(quotation.id),
          actionLabel: 'Review & Approve Quotation',
        })
      )
    );
  } catch (error) {
    console.error('[quotations:notify-approvers]', error);
  }
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

// Notifies every active sales-role user (agents, reps, and managers alike)
// once an approved quotation has actually been emailed to the customer —
// distinct from notifyManagersOfNewLead (fires at lead-creation, managers
// only). Best-effort, same semantics as its siblings here.
export async function notifyStaffOfQuotationSent(quotation: Quotation, sentByName: string | null): Promise<void> {
  try {
    const staff = await listSalesReps();
    if (staff.length === 0) return;

    const totalPrice =
      quotation.unitPrice != null
        ? quotation.unitPrice * (quotation.quantity ?? 1) - (quotation.discountAmount ?? 0) + (quotation.vatAmount ?? 0)
        : null;

    const details = [
      quotationDetails(quotation),
      quotation.quotationNo ? `Quotation number: ${quotation.quotationNo}` : '',
      totalPrice != null ? `Total price: ETB ${totalPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '',
      `Sent by: ${sentByName || 'Unknown'}`,
    ].filter(Boolean).join('\n');

    await Promise.allSettled(
      staff.map((member) =>
        sendStatusEmail({
          to: member.email,
          name: member.name,
          entityType: 'quotation sent for signature',
          status: 'sent',
          reference: quotation.reference || quotation.quotationNo || quotation.id,
          details,
          actionUrl: adminQuotationUrl(quotation.id),
          actionLabel: 'View Quotation in Admin',
        })
      )
    );
  } catch (error) {
    console.error('[quotations:notify-staff-sent]', error);
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
