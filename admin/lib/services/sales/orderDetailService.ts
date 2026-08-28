import { salesOrderRepository } from '@/repositories/salesOrderRepository';

export async function getOrderDetail(id: string) {
  return salesOrderRepository.findByIdWithDetail(id);
}

export type UpdateOrderFieldsResult =
  | { ok: true; order: any }
  | { ok: false; httpStatus: 409; error: string };

// Field-level edits only (financing status, total price, registration,
// commission assignment). Status transitions go through /status; PDI
// toggles go through /pdi; invoice generation and approval go through
// their own dedicated one-way action routes (.../invoice, .../approve).
export async function updateOrderFields(
  id: string,
  input: {
    financingStatus?: string;
    totalPrice?: number | null;
    signedDocumentUrl?: string | null;
    registrationNumber?: string | null;
    salesAgentId?: string | null;
    commissionRate?: number | null;
  },
  actingUserId: string
): Promise<UpdateOrderFieldsResult> {
  const { financingStatus, totalPrice, signedDocumentUrl, registrationNumber, salesAgentId, commissionRate } = input;

  // Fetched first so editing salesAgentId doesn't clobber a commission
  // that's already EARNED/PAID — that already happened as a consequence
  // of delivery and an edit here afterward shouldn't erase the record.
  // Also covers the totalPrice guard below (need approvedAt either way).
  const existing = (salesAgentId !== undefined || totalPrice !== undefined)
    ? await salesOrderRepository.findPatchGuardFields(id)
    : null;

  if (totalPrice !== undefined && existing?.approvedAt) {
    return { ok: false, httpStatus: 409, error: 'Price cannot be changed after the order has been approved.' };
  }

  const order = await salesOrderRepository.update(id, {
    ...(financingStatus !== undefined && { financingStatus: financingStatus as any }),
    ...(totalPrice !== undefined && { totalPrice: totalPrice === null ? null : Number(totalPrice) }),
    // Staff-attached photo/scan of the physically-signed sales agreement
    // (BRD-adjacent "e-sign or attach" step) — reuses the same
    // upload-then-PATCH convention as TestDrive.idPhotoUrl.
    ...(signedDocumentUrl !== undefined && {
      signedDocumentUrl,
      signedAt: signedDocumentUrl ? new Date() : null,
      // A freshly-attached signed copy implicitly resolves a prior
      // "Return for Correction" — back to the manager for a fresh look.
      ...(signedDocumentUrl && { rejectedAt: null, rejectedById: null, rejectionReason: null }),
    }),
    // Vehicle registration — a plain field edit (unlike approval/signing,
    // a mistyped plate number is just a correction, not a business event
    // that needs a one-way gate).
    ...(registrationNumber !== undefined && {
      registrationNumber,
      registeredAt: registrationNumber ? new Date() : null,
      registeredById: registrationNumber ? actingUserId : null,
    }),
    // Commission assignment — salesAgentId is free text, matching
    // Quotation.assignedTo's existing convention (no user-picker UI).
    ...(salesAgentId !== undefined && {
      salesAgentId,
      ...(existing?.commissionStatus !== 'EARNED' && existing?.commissionStatus !== 'PAID' && {
        commissionStatus: salesAgentId ? 'PENDING' : 'NOT_APPLICABLE',
      }),
    }),
    ...(commissionRate !== undefined && { commissionRate: commissionRate === null ? null : Number(commissionRate) }),
  });

  return { ok: true, order };
}
