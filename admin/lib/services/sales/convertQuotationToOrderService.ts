import { quotationRepository } from '@/repositories/quotationRepository';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { nextOrderNo } from '@/lib/services/sales/orderNumber';
import { PDI_CHECKLIST_TEMPLATE } from '@/lib/services/sales/pdiChecklistTemplate';
import { computeQuotationTotals } from '@/lib/services/sales/salesQuotationPdf';

export type ConvertQuotationResult =
  | { ok: true; order: any }
  | { ok: false; httpStatus: 404 | 409; error: string; orderId?: string };

// UC-12 Book Order & PDI (BRD §6.1): converts an accepted quotation into a
// bookable sales order and seeds its default PDI checklist. A quotation can
// be converted at most once — SalesOrder.quotationId is unique.
export async function convertQuotationToOrder(id: string, actingUserId: string): Promise<ConvertQuotationResult> {
  const quotation = await quotationRepository.findByIdWithSalesOrder(id);
  if (!quotation) {
    return { ok: false, httpStatus: 404, error: 'Quotation not found' };
  }

  if (quotation.salesOrder) {
    return { ok: false, httpStatus: 409, error: 'This quotation already has an order', orderId: quotation.salesOrder.id };
  }

  if (quotation.managerApprovalStatus !== 'APPROVED') {
    return { ok: false, httpStatus: 409, error: 'This quotation needs manager approval before it can become an order.' };
  }

  const orderNo = await nextOrderNo();

  const order = await salesOrderRepository.create({
    orderNo,
    quotation: { connect: { id: quotation.id } },
    customerName: quotation.customerName,
    customerPhone: quotation.phoneNumber,
    customerEmail: quotation.email || null,
    vehicleModel: quotation.vehicleModel || 'General enquiry',
    configurationJson: quotation.configurationJson ?? undefined,
    // Inherited from the quotation's own agreed price — same VAT/discount
    // math already shown to and signed by the customer — so the agreement/
    // handover PDFs don't show "To be confirmed" when a real price exists.
    totalPrice: quotation.unitPrice != null
      ? computeQuotationTotals(quotation.unitPrice, quotation.quantity ?? 1, quotation.discountAmount ?? 0).totalPayable
      : null,
    financingStatus: quotation.financingInterest ? 'REQUESTED' : 'NOT_REQUESTED',
    // Inherit the rep already working this lead (see web/lib/assignSalesRep.ts)
    // instead of starting the order unassigned.
    salesAgentId: quotation.assignedTo ?? null,
    commissionStatus: quotation.assignedTo ? 'PENDING' : 'NOT_APPLICABLE',
    status: 'BOOKED',
    statusHistory: {
      create: { fromStatus: null, toStatus: 'BOOKED', changedById: actingUserId },
    },
    pdiItems: {
      create: PDI_CHECKLIST_TEMPLATE.map((label) => ({ label })),
    },
  });

  if (quotation.status !== 'converted') {
    await quotationRepository.updateStatus(quotation.id, 'converted');
  }

  return { ok: true, order };
}
