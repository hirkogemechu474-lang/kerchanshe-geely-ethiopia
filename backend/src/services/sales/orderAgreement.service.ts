import { salesOrderRepository } from '../../repositories';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';

export const orderAgreementService = {
  async getAgreementView(orderId: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, 'agreement', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      return {
        ok: true,
        data: {
          orderNo: order.orderNo,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          vehicleModel: order.vehicleModel,
          color: order.color,
          totalPrice: order.totalPrice,
          signedDocumentUrl: order.signedDocumentUrl,
          signedAt: order.signedAt,
          status: order.status,
        },
      };
    } catch (error: any) {
      console.error('[AGREEMENT VIEW ERROR]', error.message);
      return { ok: false, error: 'Failed to load agreement.' };
    }
  },

  async signAgreement(orderId: string, token: string, signedDocumentUrl: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, 'agreement', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const updated = await salesOrderRepository.updateSignature(orderId, {
        signedDocumentUrl,
        signedAt: new Date(),
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[AGREEMENT SIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to sign agreement.' };
    }
  },

  generateAgreementLink(orderId: string): string {
    const token = signLinkToken('agreement', orderId);
    return `/agreement/${orderId}?token=${token}`;
  },
};
