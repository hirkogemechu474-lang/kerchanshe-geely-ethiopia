import { salesOrderRepository } from '../../repositories';
import { formatCurrency } from '../../utils/formatting';

export const orderInvoiceService = {
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
