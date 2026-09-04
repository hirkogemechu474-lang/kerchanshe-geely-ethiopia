import { salesOrderRepository, userRepository } from '../../repositories';
import { formatCurrency } from '../../utils/formatting';
import { generateSalesInvoicePdf, InvoiceLineItem, SalesInvoicePdfData } from '../pdf/salesInvoice.pdf';
import { HandoverItemRow } from '../pdf/handover.pdf';
import { getCompanyInfo } from '../pdf/companyInfo';

async function buildInvoicePdfData(order: any): Promise<SalesInvoicePdfData> {
  const config = (order.configurationJson as Record<string, any> | null) || {};
  const detail = await salesOrderRepository.findByIdWithDocumentDetail(order.id);
  const sellerSigner = order.invoicedById ? await userRepository.findById(order.invoicedById) : null;

  return {
    orderNo: order.orderNo,
    customerName: order.customerName,
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
    sellerSignerName: sellerSigner?.name ?? null,
  };
}

export const orderInvoiceService = {
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

      const { signLinkToken, verifyLinkToken } = await import('../../utils/secureLink');
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
