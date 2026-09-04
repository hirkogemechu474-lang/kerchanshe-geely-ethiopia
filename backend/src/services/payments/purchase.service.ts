import type { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { salesOrderRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { sendEmail } from '../email/smtp';
import { seedPdiChecklist } from '../sales/pdiChecklist.template';

// NOTE: no `Purchase` model exists in schema.prisma — a purchase is a
// `SalesOrder` (see the identical note in public.routes.ts and
// payments.routes.ts). The line-item cart shape this service accepts has
// no dedicated columns on SalesOrder, so it's kept as structured data in
// `configurationJson`, matching that field's existing "flexible JSON blob"
// convention; there's also no `reference` column on SalesOrder, so the
// generated reference is only used in the confirmation email, not stored.
export const purchaseService = {
  async create(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    notes?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reference = await generateReference(REFERENCE_CATEGORY.PURCHASE);
      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const orderNo = await salesOrderRepository.nextOrderNo();

      const purchase = await prisma.salesOrder.create({
        data: {
          orderNo,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          vehicleModel: data.items.map((item) => item.name).join(', ') || 'Parts purchase',
          totalPrice: totalAmount,
          configurationJson: {
            items: data.items.map((item) => ({ ...item, totalPrice: item.quantity * item.unitPrice })),
            notes: data.notes ?? null,
          },
        },
      });

      await seedPdiChecklist(prisma, purchase.id);

      await sendEmail({
        to: data.customerEmail,
        subject: `Purchase Confirmation - ${reference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Purchase Confirmation</h2>
            <p>Dear ${data.customerName},</p>
            <p>Your purchase has been recorded successfully.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Reference:</strong> ${reference}</p>
              <p style="margin: 4px 0;"><strong>Total:</strong> ${totalAmount.toLocaleString()} ETB</p>
            </div>
          </div>
        `,
      });

      return { ok: true, data: purchase };
    } catch (error: any) {
      console.error('[PURCHASE CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create purchase.' };
    }
  },

  async list(params?: { status?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = {};
      if (params?.status && params.status !== 'all') where.status = params.status;

      const purchases = await prisma.salesOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return { ok: true, data: purchases };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch purchases.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const purchase = await prisma.salesOrder.findUnique({
        where: { id },
      });
      if (!purchase) return { ok: false, error: 'Purchase not found.' };
      return { ok: true, data: purchase };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch purchase.' };
    }
  },

  async updateStatus(id: string, status: OrderStatus): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const purchase = await prisma.salesOrder.update({
        where: { id },
        data: { status },
      });
      return { ok: true, data: purchase };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update purchase status.' };
    }
  },
};
