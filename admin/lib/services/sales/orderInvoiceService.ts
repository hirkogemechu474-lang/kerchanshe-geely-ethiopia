import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { nextInvoiceNo } from '@/lib/services/sales/orderNumber';
import { buildSalesInvoicePdf } from '@/lib/services/sales/salesInvoicePdf';
import { sendStatusEmail } from '@/lib/status-email';

export type OrderActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; httpStatus: 404 | 409 | 500; error: string };

export async function getInvoicePdf(id: string): Promise<OrderActionResult<{ pdfBytes: Uint8Array; invoiceNo: string }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.invoicedAt) {
    return { ok: false, httpStatus: 409, error: 'This order has not been invoiced yet.' };
  }

  const pdfBytes = await buildSalesInvoicePdf(order);
  return { ok: true, pdfBytes, invoiceNo: order.invoiceNo! };
}

// Generates the invoice (one-way; 409 if already generated) and emails it
// to the customer. Deliberately minimal scope, mirroring
// JobCard.invoiceAmount: a single amount, not a line-item invoice/AR
// posting (needs an ERP this codebase doesn't have).
export async function generateInvoice(id: string, actingUserId: string): Promise<OrderActionResult<{ order: any; notificationSent: boolean }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (order.invoicedAt) return { ok: false, httpStatus: 409, error: 'This order has already been invoiced' };

  // System-generated, not staff-editable: always the order's own agreed
  // price, so the invoice can never drift from what was actually approved.
  const invoiceAmount = order.totalPrice;

  let updated;
  try {
    const invoiceNo = await nextInvoiceNo();
    updated = await salesOrderRepository.update(id, { invoiceNo, invoiceAmount, invoicedAt: new Date(), invoicedById: actingUserId });
  } catch (dbError) {
    console.error('[orders:invoice:generate]', dbError);
    return { ok: false, httpStatus: 500, error: 'Failed to generate invoice. Please try again.' };
  }

  let notificationSent = false;
  if (updated.customerEmail) {
    try {
      const pdfBytes = await buildSalesInvoicePdf(updated);
      notificationSent = await sendStatusEmail({
        to: updated.customerEmail,
        name: updated.customerName,
        entityType: 'sales order',
        status: 'invoiced',
        reference: updated.orderNo,
        details: `Your invoice ${updated.invoiceNo} is attached.`,
        attachments: [{ filename: `${updated.invoiceNo}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }],
      });
    } catch (emailError) {
      console.error('[orders:invoice:email]', emailError);
    }
  }

  return { ok: true, order: updated, notificationSent };
}
