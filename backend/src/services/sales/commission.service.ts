import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

export const commissionService = {
  /**
   * Set commission owner on order creation/conversion.
   * If the originating quotation had an assignedTo, that becomes the
   * originalSalesAgentId and the commission starts fully with them (100%).
   */
  async initializeCommission(
    orderId: string,
    agentId: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      await prisma.salesOrder.update({
        where: { id: orderId },
        data: {
          originalSalesAgentId: agentId,
          salesAgentId: agentId,
          commissionSplitPercent: 100,
          commissionStatus: 'NOT_APPLICABLE',
        },
      });

      return { ok: true };
    } catch (error: any) {
      console.error('[COMMISSION INIT ERROR]', error.message);
      return { ok: false, error: 'Failed to initialize commission.' };
    }
  },

  /**
   * Reassign commission ownership to a different agent with configurable
   * split (default 60/40 to original agent per workflow spec).
   */
  async reassign(
    orderId: string,
    newAgentId: string,
    reassignedById: string,
    splitPercent: number = 60,
    note?: string
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false, error: 'Order not found.' };

      const previousOwner = order.salesAgentId;
      const previousSplit = order.commissionSplitPercent ?? 100;

      // Update the order with new commission owner and split
      const updated = await prisma.salesOrder.update({
        where: { id: orderId },
        data: {
          salesAgentId: newAgentId,
          commissionSplitPercent: splitPercent,
          commissionReassignedAt: new Date(),
          commissionReassignedById: reassignedById,
          commissionReassignmentNote: note || null,
        },
      });

      // Record history
      await prisma.commissionHistory.create({
        data: {
          orderId,
          eventType: 'REASSIGNED',
          fromAgentId: previousOwner,
          toAgentId: newAgentId,
          fromSplitPercent: previousSplit,
          toSplitPercent: splitPercent,
          changedById: reassignedById,
          note: note || null,
        },
      });

      // Notify both agents
      const [originalAgent, newAgent] = await Promise.all([
        order.originalSalesAgentId
          ? prisma.user.findUnique({ where: { id: order.originalSalesAgentId } })
          : null,
        prisma.user.findUnique({ where: { id: newAgentId } }),
      ]);

      const notifyEmails: string[] = [];
      if (newAgent?.email) notifyEmails.push(newAgent.email);
      if (originalAgent?.email && originalAgent.id !== newAgentId) {
        notifyEmails.push(originalAgent.email);
      }

      if (notifyEmails.length > 0) {
        await dispatchNotification({
          type: 'commission_reassigned',
          to: notifyEmails,
          subject: `Commission Ownership Changed - Order ${order.orderNo}`,
          data: {
            orderNo: order.orderNo,
            previousOwner: previousOwner,
            newOwner: newAgent?.name || newAgentId,
            splitPercent,
            originalOwnerPercent: 100 - splitPercent,
          },
        });
      }

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[COMMISSION REASSIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to reassign commission.' };
    }
  },

  /**
   * Mark commission as EARNED when payment is confirmed.
   * Called automatically when order status reaches DELIVERED and payment confirmed.
   */
  async markEarned(
    orderId: string,
    confirmedById: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false, error: 'Order not found.' };
      if (!order.salesAgentId) return { ok: false, error: 'No sales agent assigned to this order.' };

      // Calculate commission amount based on split
      const rate = order.commissionRate ?? 0;
      const totalCommission = (order.totalPrice ?? 0) * rate / 100;
      const agentCommission = totalCommission * (order.commissionSplitPercent ?? 100) / 100;

      const updated = await prisma.salesOrder.update({
        where: { id: orderId },
        data: {
          commissionStatus: 'EARNED',
          commissionAmount: agentCommission,
        },
      });

      await prisma.commissionHistory.create({
        data: {
          orderId,
          eventType: 'PAYMENT_CONFIRMED',
          fromAgentId: null,
          toAgentId: order.salesAgentId,
          amount: agentCommission,
          changedById: confirmedById,
          note: `Commission of ${agentCommission.toFixed(2)} earned (${order.commissionSplitPercent}% of ${(totalCommission).toFixed(2)})`,
        },
      });

      return { ok: true };
    } catch (error: any) {
      console.error('[COMMISSION MARK EARNED ERROR]', error.message);
      return { ok: false, error: 'Failed to mark commission as earned.' };
    }
  },

  /**
   * Mark commission as PAID when paid out in payroll.
   */
  async markPaid(
    orderId: string,
    paidById: string,
    paymentRef: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false, error: 'Order not found.' };
      if (order.commissionStatus !== 'EARNED') {
        return { ok: false, error: 'Commission must be EARNED before it can be marked as PAID.' };
      }

      const updated = await prisma.salesOrder.update({
        where: { id: orderId },
        data: {
          commissionStatus: 'PAID',
          commissionPaidAt: new Date(),
          commissionPaidById: paidById,
          commissionPaymentRef: paymentRef,
        },
      });

      await prisma.commissionHistory.create({
        data: {
          orderId,
          eventType: 'PAYMENT_PAID',
          toAgentId: order.salesAgentId,
          amount: order.commissionAmount,
          changedById: paidById,
          note: `Commission paid out. Ref: ${paymentRef}`,
        },
      });

      // Notify the agent
      const agent = await prisma.user.findUnique({ where: { id: order.salesAgentId! } });
      if (agent?.email) {
        await dispatchNotification({
          type: 'commission_paid',
          to: [agent.email],
          subject: `Commission Paid - Order ${order.orderNo}`,
          data: {
            orderNo: order.orderNo,
            amount: order.commissionAmount,
            paymentRef,
          },
        });
      }

      return { ok: true };
    } catch (error: any) {
      console.error('[COMMISSION MARK PAID ERROR]', error.message);
      return { ok: false, error: 'Failed to mark commission as paid.' };
    }
  },

  /**
   * Get commission details for an order.
   */
  async getCommissionDetails(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNo: true,
          totalPrice: true,
          salesAgentId: true,
          originalSalesAgentId: true,
          commissionRate: true,
          commissionAmount: true,
          commissionStatus: true,
          commissionSplitPercent: true,
          commissionReassignedAt: true,
          commissionReassignmentNote: true,
          commissionPaidAt: true,
          commissionPaymentRef: true,
        },
      });
      if (!order) return { ok: false, error: 'Order not found.' };

      // Get agent names
      const [currentAgent, originalAgent] = await Promise.all([
        order.salesAgentId ? prisma.user.findUnique({ where: { id: order.salesAgentId }, select: { name: true, email: true } }) : null,
        order.originalSalesAgentId ? prisma.user.findUnique({ where: { id: order.originalSalesAgentId }, select: { name: true, email: true } }) : null,
      ]);

      // Get history
      const history = await prisma.commissionHistory.findMany({
        where: { orderId },
        orderBy: { changedAt: 'asc' },
      });

      return {
        ok: true,
        data: {
          ...order,
          currentAgentName: currentAgent?.name,
          originalAgentName: originalAgent?.name,
          history,
        },
      };
    } catch (error: any) {
      console.error('[COMMISSION GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch commission details.' };
    }
  },

  /**
   * List commissions with filters (for payroll/accounting).
   */
  async list(params: {
    status?: string;
    agentId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (params.status) where.commissionStatus = params.status;
      if (params.agentId) where.salesAgentId = params.agentId;

      const [orders, total] = await Promise.all([
        prisma.salesOrder.findMany({
          where,
          select: {
            id: true,
            orderNo: true,
            customerName: true,
            totalPrice: true,
            salesAgentId: true,
            originalSalesAgentId: true,
            commissionRate: true,
            commissionAmount: true,
            commissionStatus: true,
            commissionSplitPercent: true,
            commissionPaidAt: true,
            commissionPaymentRef: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.salesOrder.count({ where }),
      ]);

      return {
        ok: true,
        data: {
          commissions: orders,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[COMMISSION LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch commissions.' };
    }
  },
};