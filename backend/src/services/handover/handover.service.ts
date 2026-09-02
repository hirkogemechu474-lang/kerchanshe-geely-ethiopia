import { salesOrderRepository } from '../../repositories';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';

export const handoverService = {
  async getHandoverView(orderId: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, 'handover', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const config = (order.configurationJson as Record<string, any> | null) || {};

      return {
        ok: true,
        data: {
          orderNo: order.orderNo,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          vehicleModel: order.vehicleModel,
          color: config.color ?? null,
          totalPrice: order.totalPrice,
          handoverSignedDocumentUrl: order.handoverSignedDocumentUrl,
          handoverSignedAt: order.handoverSignedAt,
          status: order.status,
        },
      };
    } catch (error: any) {
      console.error('[HANDOVER VIEW ERROR]', error.message);
      return { ok: false, error: 'Failed to load handover.' };
    }
  },

  async signHandover(orderId: string, token: string, handoverSignedDocumentUrl: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, 'handover', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const updated = await salesOrderRepository.updateHandoverSignature(orderId, {
        handoverSignedDocumentUrl,
        handoverSignedAt: new Date(),
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[HANDOVER SIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to sign handover.' };
    }
  },

  generateHandoverLink(orderId: string): string {
    const token = signLinkToken('handover', orderId);
    return `/handover/${orderId}?token=${token}`;
  },
};
