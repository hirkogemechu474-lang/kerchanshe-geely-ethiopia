import { salesOrderRepository, quotationRepository, vehicleRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { commissionService } from './commission.service';
import { seedPdiChecklist } from './pdiChecklist.template';
import { prisma } from '../../config/database';

// Real OrderStatus enum values are QUOTED/BOOKED/FINANCING_PENDING/
// READY_FOR_DELIVERY/DELIVERED/CANCELLED (see schema.prisma) — this used to
// reference 'ALLOCATED'/'INVOICE_GENERATED', which are not valid OrderStatus
// values and would make every real transition attempt fail once a caller
// tried to reach them. Gated per the documented business rules (PDI 100%
// complete, agreement signed, payment confirmed before READY_FOR_DELIVERY;
// registration + invoice before DELIVERED — see getTransitionBlockReason
// below and apps/admin's OrderDetail.tsx, which gates the same way client-side).
export const orderStateMachine = {
  validTransitions: {
    QUOTED: ['BOOKED', 'CANCELLED'],
    BOOKED: ['FINANCING_PENDING', 'READY_FOR_DELIVERY', 'CANCELLED'],
    FINANCING_PENDING: ['READY_FOR_DELIVERY', 'CANCELLED'],
    READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  } as Record<string, string[]>,

  canTransition(from: string, to: string): boolean {
    return this.validTransitions[from]?.includes(to) ?? false;
  },

  getValidTransitions(status: string): string[] {
    return this.validTransitions[status] ?? [];
  },
};

// BR: "An order cannot be marked 'ready for delivery' until the PDI
// checklist is 100% complete" (see PdiChecklistItem model comment), plus the
// agreement + payment gates the Approval/Payment panels enforce, and the
// registration + invoice gates the Fulfillment panel enforces before
// DELIVERED. Returns a human-readable reason the transition is blocked, or
// null if it's allowed.
function getTransitionBlockReason(order: { pdiItems?: { isChecked: boolean }[]; approvedAt: Date | null; signedDocumentUrl: string | null; paymentStatus: string; registeredAt: Date | null; invoicedAt: Date | null }, toStatus: string): string | null {
  if (toStatus === 'READY_FOR_DELIVERY') {
    const pdiItems = order.pdiItems ?? [];
    const pdiComplete = pdiItems.length > 0 && pdiItems.every((p) => p.isChecked);
    if (!pdiComplete) return 'Complete the PDI checklist before marking this order ready for delivery.';
    const agreementComplete = Boolean(order.approvedAt) && Boolean(order.signedDocumentUrl);
    if (!agreementComplete) return 'Approve the order and attach the signed agreement before marking it ready for delivery.';
    if (order.paymentStatus !== 'PAID') return 'Confirm payment before marking this order ready for delivery.';
  }
  if (toStatus === 'DELIVERED') {
    if (!order.registeredAt) return 'Record the vehicle registration number before marking this order delivered.';
    if (!order.invoicedAt) return 'Generate the sales invoice before marking this order delivered.';
  }
  return null;
}

export const orderService = {
  async create(data: {
    quotationId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    vehicleModel: string;
    color?: string;
    totalPrice: number;
    assignedTo?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const orderNo = await salesOrderRepository.nextOrderNo();

      // SalesOrder has no `vehicleId`/`color` columns — real allocation
      // happens later via VehicleAllocation, and a requested color is part
      // of configurationJson (same shape Quotation.configurationJson uses;
      // see the field's doc comment on the SalesOrder model).
      const order = await salesOrderRepository.create({
        orderNo,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        vehicleModel: data.vehicleModel,
        ...(data.color && { configurationJson: { color: data.color } }),
        totalPrice: data.totalPrice,
        status: 'QUOTED',
        paymentStatus: 'UNPAID',
        financingStatus: 'NOT_REQUESTED',
        orderDate: new Date(),
        ...(data.assignedTo && { assignedTo: data.assignedTo }),
        ...(data.quotationId && {
          quotation: { connect: { id: data.quotationId } },
        }),
      });

      // Initialize commission ownership if sales agent is assigned
      if (data.assignedTo) {
        await commissionService.initializeCommission(order.id, data.assignedTo);
      }

      await seedPdiChecklist(prisma, order.id);

      return { ok: true, data: order };
    } catch (error: any) {
      console.error('[ORDER CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create order.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByIdWithDetail(id);
      if (!order) return { ok: false, error: 'Order not found.' };
      return { ok: true, data: order };
    } catch (error: any) {
      console.error('[ORDER GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch order.' };
    }
  },

  async list(params: {
    where?: any;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const [orders, total, statusCounts] = await salesOrderRepository.findPage(params.where, skip, pageSize);

      return {
        ok: true,
        data: {
          orders,
          total,
          statusCounts,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[ORDER LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch orders.' };
    }
  },

  async transitionWithCommission(id: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByIdWithPdiItems(id);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!orderStateMachine.canTransition(order.status, toStatus)) {
        return { ok: false, error: `Cannot transition from ${order.status} to ${toStatus}.` };
      }

      const blockReason = getTransitionBlockReason(order, toStatus);
      if (blockReason) return { ok: false, error: blockReason };

      // Determine commission status based on new status
      let commissionStatus = order.commissionStatus;
      if (toStatus === 'DELIVERED' && commissionStatus !== 'EARNED') {
        commissionStatus = 'EARNED'; // Auto-earn commission when delivered
        // Also use commissionService to properly calculate and record the earned amount
        await commissionService.markEarned(id, changedById);
      } else if (toStatus === 'CANCELLED' && commissionStatus !== 'NOT_APPLICABLE') {
        commissionStatus = 'NOT_APPLICABLE'; // Reset if cancelled
      }

      // commissionStatus is a SalesOrder column, not a SalesOrderStatusHistory
      // one — it belongs in the first (order-update) argument, not the
      // history-row argument (where it doesn't exist and never actually
      // reached the database under the old wiring).
      const result = await salesOrderRepository.transitionStatus(
        id,
        { status: toStatus as any, commissionStatus: commissionStatus as any },
        {
          fromStatus: order.status as any,
          toStatus: toStatus as any,
          changedById,
          reasonCode: reasonCode ?? null,
        }
      );

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[ORDER STATE TRANSITION WITH COMMISSION ERROR]', error.message);
      return { ok: false, error: 'Failed to transition order status.' };
    }
  },

  async transitionStatus(id: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByIdWithPdiItems(id);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!orderStateMachine.canTransition(order.status, toStatus)) {
        return { ok: false, error: `Cannot transition from ${order.status} to ${toStatus}.` };
      }

      const blockReason = getTransitionBlockReason(order, toStatus);
      if (blockReason) return { ok: false, error: blockReason };

      const result = await salesOrderRepository.transitionStatus(
        id,
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
      console.error('[ORDER TRANSITION ERROR]', error.message);
      return { ok: false, error: 'Failed to update order status.' };
    }
  },

  async updatePdiItem(itemId: string, orderId: string, data: { isChecked: boolean; checkedById?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const item = await salesOrderRepository.findPdiItem(itemId, orderId);
      if (!item) return { ok: false, error: 'PDI item not found.' };

      // PdiChecklistItem has no `notes` column (the old wiring silently
      // dropped it into an unchecked spread and would have thrown at
      // runtime the first time a caller actually passed one) — it does have
      // checkedById/checkedAt, which were never being stamped at all.
      const updated = await salesOrderRepository.updatePdiItem(itemId, {
        isChecked: data.isChecked,
        checkedById: data.isChecked ? (data.checkedById ?? null) : null,
        checkedAt: data.isChecked ? new Date() : null,
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[PDI UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update PDI item.' };
    }
  },

  async getOrderWithPdiItems(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByIdWithPdiItems(id);
      if (!order) return { ok: false, error: 'Order not found.' };
      return { ok: true, data: order };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch order PDI items.' };
    }
  },

  async getStatusByOrderNo(orderNo: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByOrderNoForStatus(orderNo);
      if (!order) return { ok: false, error: 'Order not found.' };
      return { ok: true, data: order };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch order status.' };
    }
  },
};