import { salesOrderRepository } from '../../repositories';

export const orderStateMachineService = {
  getValidTransitions(status: string): string[] {
    const transitions: Record<string, string[]> = {
      QUOTED: ['BOOKED', 'CANCELLED'],
      BOOKED: ['FINANCING_PENDING', 'ALLOCATED', 'CANCELLED'],
      FINANCING_PENDING: ['ALLOCATED', 'CANCELLED'],
      ALLOCATED: ['INVOICE_GENERATED', 'CANCELLED'],
      INVOICE_GENERATED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };
    return transitions[status] ?? [];
  },

  canTransition(from: string, to: string): boolean {
    return this.getValidTransitions(from).includes(to);
  },

  async transition(orderId: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!this.canTransition(order.status, toStatus)) {
        return { ok: false, error: `Invalid transition: ${order.status} → ${toStatus}` };
      }

      const result = await salesOrderRepository.transitionStatus(
        orderId,
        { status: toStatus as any },
        {
          fromStatus: order.status as any,
          toStatus: toStatus as any,
          changedById,
          reasonCode: reasonCode ?? null,
        }
      );

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[ORDER STATE MACHINE ERROR]', error.message);
      return { ok: false, error: 'Failed to transition order status.' };
    }
  },
};
