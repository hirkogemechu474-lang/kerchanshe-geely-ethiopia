import { salesOrderRepository, userRepository } from '../../repositories';
import { formatCurrency } from '../../utils/formatting';
import { generateSalesInvoicePdf, InvoiceLineItem, SalesInvoicePdfData } from '../pdf/salesInvoice.pdf';
import { generateReceiptPdf, ReceiptPdfData } from '../pdf/receipt.pdf';
import { HandoverItemRow } from '../pdf/handover.pdf';
import { getCompanyInfo } from '../pdf/companyInfo';
import { roleLabel } from '../../utils/roleLabels';

async function buildInvoicePdfData(order: any): Promise<SalesInvoicePdfData> {
  const config = (order.configurationJson as Record<string, any> | null) || {};
  const detail = await salesOrderRepository.findByIdWithDocumentDetail(order.id);
  const [sellerSigner, managerSigner] = await Promise.all([
    order.invoicedById ? userRepository.findById(order.invoicedById) : Promise.resolve(null),
    order.countersignedById ? userRepository.findByIdSlim(order.countersignedById) : Promise.resolve(null),
  ]);

  return {
    orderNo: order.orderNo,
    customerName: order.customerName,
    purchaserTitle: order.purchaserTitle,
    purchaserAuthorizedRep: order.purchaserAuthorizedRep,
    vehicleModel: order.vehicleModel,
    totalPrice: order.invoiceAmount ?? order.totalPrice ?? 0,
    invoiceNo: order.invoiceNo,
    quotationNo: detail?.quotation?.quotationNo ?? null,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerTin: order.purchaserTin,
    customerAddress: order.purchaserAddress,
    color: config.color ?? null,
    vehicleVariant: config.variant ?? null,
    vin: detail?.vehicleAllocation?.vin ?? null,
    motorBatterySerialNo: order.motorBatterySerialNo,
    odometerAtDelivery: order.odometerAtDelivery,
    orderDate: order.invoicedAt ?? order.orderDate ?? order.createdAt,
    salesType: order.salesType,
    paymentStatus: order.paymentStatus,
    lineItems: (order.invoiceLineItems as InvoiceLineItem[] | null) ?? null,
    vatAmount: order.vatAmount,
    registrationCharge: order.registrationCharge,
    amountPaid: order.amountPaid,
    paymentMethod: order.paymentMethod,
    paymentReferenceNo: order.paymentReferenceNo,
    deliveryDate: order.deliveredAt ?? order.handoverSignedAt,
    deliveryLocation: order.deliveryLocation,
    itemsHandedOver: (order.itemsHandedOver as HandoverItemRow[] | null) ?? null,
    // The printed name/title must match whoever's signature/stamp image is
    // actually shown below them (managerSignatureUrl/managerStampUrl, from
    // managerSigner) — this used to print the invoice-generating rep's name
    // (sellerSigner, e.g. a sales_representative) next to the countersigning
    // manager's own signature, a mismatched pairing. Falls back to the rep
    // only when no manager has countersigned yet.
    sellerSignerName: managerSigner?.name || sellerSigner?.name || null,
    sellerSignerTitle: managerSigner?.title || sellerSigner?.title || roleLabel(managerSigner?.role) || roleLabel(sellerSigner?.role) || null,
    customerSignatureUrl: order.signedDocumentUrl,
    customerSignedAt: order.signedAt,
    managerSignatureUrl: managerSigner?.signatureUrl,
    managerStampUrl: managerSigner?.stampUrl,
    // The manager's signature/stamp shown here is the same countersignature
    // captured on the Sales Agreement (same managerSigner, from
    // order.countersignedById) — not a separate invoice-specific signing —
    // so its date is that same countersignedAt, not left blank.
    managerSignedAt: order.countersignedAt,
  };
}

async function buildReceiptPdfData(order: any): Promise<ReceiptPdfData> {
  const detail = await salesOrderRepository.findByIdWithDocumentDetail(order.id);
  const verifier = order.paymentVerifiedById ? await userRepository.findByIdSlim(order.paymentVerifiedById) : null;

  return {
    orderNo: order.orderNo,
    customerName: order.customerName,
    purchaserTitle: order.purchaserTitle,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    vehicleModel: order.vehicleModel,
    vin: detail?.vehicleAllocation?.vin ?? null,
    totalPrice: order.totalPrice,
    amountPaid: order.amountPaid,
    paymentMethod: order.paymentMethod,
    paymentReferenceNo: order.paymentReferenceNo,
    paymentVerifiedAt: order.paymentVerifiedAt,
    verifiedByName: verifier?.name ?? null,
    verifiedByTitle: verifier?.title ?? null,
  };
}

export const orderInvoiceService = {
  async generateReceiptPdf(orderId: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order || !order.paymentVerifiedAt) return { ok: false, error: 'Receipt not available yet.' };

      const [pdfData, company] = await Promise.all([buildReceiptPdfData(order), getCompanyInfo()]);
      const pdfBuffer = await generateReceiptPdf(pdfData, company);

      return { ok: true, data: pdfBuffer };
    } catch (error: any) {
      console.error('[RECEIPT PDF ERROR]', error.message);
      return { ok: false, error: 'Failed to generate receipt PDF.' };
    }
  },

  async generateInvoicePdf(orderId: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order || !order.invoicedAt) return { ok: false, error: 'Invoice not found.' };

      const [pdfData, company] = await Promise.all([buildInvoicePdfData(order), getCompanyInfo()]);
      const pdfBuffer = await generateSalesInvoicePdf(pdfData, company);

      return { ok: true, data: pdfBuffer };
    } catch (error: any) {
      console.error('[INVOICE PDF ERROR]', error.message);
      return { ok: false, error: 'Failed to generate invoice PDF.' };
    }
  },

  async getInvoiceData(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const config = (order.configurationJson as Record<string, any> | null) || {};

      return {
        ok: true,
        data: {
          orderNo: order.orderNo,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          vehicleModel: order.vehicleModel,
          color: config.color ?? null,
          totalPrice: order.totalPrice,
          formattedTotal: formatCurrency(order.totalPrice || 0),
          status: order.status,
          paymentStatus: order.paymentStatus,
          orderDate: order.orderDate,
        },
      };
    } catch (error: any) {
      console.error('[INVOICE DATA ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch invoice data.' };
    }
  },

  async updatePaymentProof(orderId: string, proofUrl: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const updated = await salesOrderRepository.updatePaymentProof(orderId, proofUrl);
      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[PAYMENT PROOF ERROR]', error.message);
      return { ok: false, error: 'Failed to update payment proof.' };
    }
  },

  async confirmPayment(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const updated = await salesOrderRepository.updatePaymentStatusPaid(orderId);
      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[CONFIRM PAYMENT ERROR]', error.message);
      return { ok: false, error: 'Failed to confirm payment.' };
    }
  },

  async getPaymentView(orderId: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const { signLinkToken, verifyLinkToken } = await import('../../utils/secureLink.js');
      if (!verifyLinkToken(token, 'payment', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      return {
        ok: true,
        data: {
          orderNo: order.orderNo,
          customerName: order.customerName,
          vehicleModel: order.vehicleModel,
          totalPrice: order.totalPrice,
          paymentStatus: order.paymentStatus,
          paymentProofUrl: order.paymentProofUrl,
        },
      };
    } catch (error: any) {
      console.error('[PAYMENT VIEW ERROR]', error.message);
      return { ok: false, error: 'Failed to load payment page.' };
    }
  },
};
