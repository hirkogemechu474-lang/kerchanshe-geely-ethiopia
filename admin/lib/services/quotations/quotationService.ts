import { quotationRepository } from '@/repositories/quotationRepository';
import { userRepository } from '@/repositories/userRepository';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { nextSalesRep } from '@/lib/assignSalesRep';
import { notifyManagersOfNewLead, notifyAssignedRep } from '@/lib/services/quotations/leadNotifications';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

// GET - Paginated quotations, optionally filtered by status. Status counts
// are computed across the whole table (not just the current page/filter) so
// the tab counts stay accurate once the list itself is paginated.
export async function listQuotations(status: string, page: number, search?: string) {
  const pageSize = 25;
  const trimmedSearch = search?.trim();
  const where = {
    ...(status && { status }),
    ...(trimmedSearch && {
      OR: [
        { customerName: { contains: trimmedSearch, mode: 'insensitive' as const } },
        { phoneNumber: { contains: trimmedSearch, mode: 'insensitive' as const } },
        { email: { contains: trimmedSearch, mode: 'insensitive' as const } },
        { vehicleModel: { contains: trimmedSearch, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [quotations, total, statusCounts] = await quotationRepository.findPage(where, (page - 1) * pageSize, pageSize);

  const countFor = (s: string) => statusCounts.find((c) => c.status === s)?._count ?? 0;

  return {
    quotations,
    total,
    page,
    pageSize,
    stats: {
      total: statusCounts.reduce((sum, c) => sum + c._count, 0),
      new: countFor('new'),
      contacted: countFor('contacted'),
      approved: countFor('approved'),
      accepted: countFor('accepted'),
      converted: countFor('converted'),
      closed: countFor('closed'),
    },
  };
}

export interface WalkInLeadInput {
  customerName: string;
  phoneNumber: string;
  email?: string;
  vehicleModel?: string;
  source?: string;
  message?: string;
}

// POST - Log a walk-in / manually-captured lead (BRD FR-101, UC-01).
// Distinct from the public web/app/api/quotations/route.ts channel: a
// Sales Executive logging someone at the counter may only have a name and
// phone number yet (UC-01: "at minimum"), and no vehicle model if it's a
// general enquiry (UC-01 alt flow).
export async function submitWalkInLead(input: WalkInLeadInput) {
  // UC-01 dedupe rule: "if the phone number matches an existing customer
  // record, the system links the new lead to that customer instead of
  // creating a duplicate." No Customer model exists for sales leads, so the
  // practical equivalent is: reuse an already-open (not converted/closed)
  // quotation for the same phone number rather than creating a second one.
  const existing = await quotationRepository.findOpenByPhone(input.phoneNumber);

  if (existing) {
    return { quotation: existing, deduped: true };
  }

  const assignedRep = await nextSalesRep();
  const quotation = await quotationRepository.create({
    customerName: input.customerName,
    phoneNumber: input.phoneNumber,
    email: input.email || null,
    vehicleModel: input.vehicleModel || null,
    source: input.source || 'walk-in',
    message: input.message || null,
    status: 'new',
    assignedTo: assignedRep?.name ?? null,
  });

  await Promise.all([
    notifyManagersOfNewLead(quotation, assignedRep?.name ?? null),
    notifyAssignedRep(quotation, assignedRep?.id ?? null),
  ]);

  return { quotation, deduped: false };
}

export interface UpdateQuotationInput {
  status?: string;
  internalNotes?: string;
  assignedTo?: string;
  assignedToId?: string;
}

export async function updateQuotation(id: string, input: UpdateQuotationInput) {
  const before = input.assignedTo !== undefined
    ? await quotationRepository.findAssignedTo(id)
    : null;

  const quotation = await quotationRepository.update(id, {
    ...(input.status && { status: input.status }),
    ...(input.internalNotes !== undefined && { internalNotes: input.internalNotes }),
    ...(input.assignedTo !== undefined && { assignedTo: input.assignedTo }),
  });

  if (input.assignedTo !== undefined && quotation.assignedTo !== before?.assignedTo) {
    let repId: string | null = input.assignedToId || null;
    if (!repId && quotation.assignedTo) {
      // Defensive fallback for a caller that doesn't supply assignedToId —
      // name isn't unique, so this is best-effort, not the primary path.
      const rep = await userRepository.findActiveSalesRepByName(quotation.assignedTo);
      repId = rep?.id ?? null;
    }
    await notifyAssignedRep(quotation, repId);
  }

  if (input.status && ['approved', 'converted', 'closed'].includes(input.status) && quotation.email) {
    try {
      const vehicle = quotation.vehicleModel
        ? await vehicleRepository.findIdByName(quotation.vehicleModel)
        : null;
      const publicWebUrl = env.app.url.replace(/\/$/, '');
      const paymentUrl = input.status === 'approved' || input.status === 'converted'
        ? `${publicWebUrl}/financing/apply?quote=${encodeURIComponent(quotation.id)}${vehicle ? `&vehicle=${encodeURIComponent(vehicle.id)}` : ''}`
        : undefined;
      await sendStatusEmail({
        to: quotation.email,
        name: quotation.customerName,
        entityType: 'Quote Request',
        status: input.status,
        reference: quotation.reference || quotation.id,
        details: `Vehicle: ${quotation.vehicleModel || 'General enquiry'}`,
        actionUrl: paymentUrl,
        actionLabel: 'Proceed with direct vehicle payment',
      });
    } catch (error) {
      console.error('[status-email] quotation', error);
    }
  }

  return quotation;
}
