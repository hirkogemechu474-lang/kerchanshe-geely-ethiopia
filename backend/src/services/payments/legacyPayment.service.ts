import { salesOrderRepository } from '../../repositories';
import { getPaymentProvider } from './provider';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';
import { sendEmail } from '../email/smtp';

export const legacyPaymentService = {
  async initiatePayment(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (order.paymentStatus === 'PAID') {
        return { ok: false, error: 'Order is already paid.' };
      }

      const provider = getPaymentProvider();
      const result = await provider.createPayment({
        amount: order.totalPrice,
        currency: 'ETB',
        orderId: order.orderNo,
        customerEmail: order.customerEmail || '',
        customerName: order.customerName,
        description: `Payment for ${order.vehicleModel} - ${order.orderNo}`,
      });

      if (!result.ok) {
        return { ok: false, error: result.error || 'Payment initiation failed.' };
      }

      return {
        ok: true,
        data: {
          paymentUrl: result.paymentUrl,
          transactionId: result.transactionId,
        },
      };
    } catch (error: any) {
      console.error('[PAYMENT INITIATE ERROR]', error.message);
      return { ok: false, error: 'Failed to initiate payment.' };
    }
  },

  async confirmPayment(orderId: string, transactionId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const provider = getPaymentProvider();
      const verification = await provider.verifyPayment(transactionId);

      if (!verification.ok || verification.status !== 'COMPLETED') {
        return { ok: false, error: 'Payment verification failed.' };
      }

      const updated = await salesOrderRepository.updatePaymentStatusPaid(orderId);
      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[PAYMENT CONFIRM ERROR]', error.message);
      return { ok: false, error: 'Failed to confirm payment.' };
    }
  },

  async getPaymentView(orderId: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

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
      return { ok: false, error: 'Failed to load payment page.' };
    }
  },

  async submitPaymentProof(orderId: string, token: string, proofUrl: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, 'payment', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const updated = await salesOrderRepository.updatePaymentProof(orderId, proofUrl);
      return { ok: true, data: updated };
    } catch (error: any) {
      return { ok: false, error: 'Failed to submit payment proof.' };
    }
  },
};
