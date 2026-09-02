import { salesOrderRepository, quotationRepository, vehicleRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';

export const orderStateMachine = {
  validTransitions: {
    QUOTED: ['BOOKED', 'CANCELLED'],
    BOOKED: ['FINANCING_PENDING', 'ALLOCATED', 'CANCELLED'],
    FINANCING_PENDING: ['ALLOCATED', 'CANCELLED'],
    ALLOCATED: ['INVOICE_GENERATED', 'CANCELLED'],
    INVOICE_GENERATED: ['DELIVERED', 'CANCELLED'],
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

export const orderService = {
  async create(data: {
    quotationId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    vehicleModel: string;
    vehicleId?: string;
    color?: string;
    totalPrice: number;
    assignedTo?: string;
    notes?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const orderNo = await salesOrderRepository.nextOrderNo();

      const order = await salesOrderRepository.create({
        orderNo,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        vehicleModel: data.vehicleModel,
        vehicleId: data.vehicleId,
        color: data.color,
        totalPrice: data.totalPrice,
        status: 'QUOTED',
        paymentStatus: 'UNPAID',
        financingStatus: 'NOT_APPLICABLE',
        orderDate: new Date(),
        ...(data.assignedTo && { assignedTo: data.assignedTo }),
        ...(data.quotationId && {
          quotation: { connect: { id: data.quotationId } },
        }),
      });

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

  async transitionStatus(id: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(id);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!orderStateMachine.canTransition(order.status, toStatus)) {
        return { ok: false, error: `Cannot transition from ${order.status} to ${toStatus}.` };
      }

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

  async updatePdiItem(itemId: string, orderId: string, data: { isChecked: boolean; notes?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const item = await salesOrderRepository.findPdiItem(itemId, orderId);
      if (!item) return { ok: false, error: 'PDI item not found.' };

      const updated = await salesOrderRepository.updatePdiItem(itemId, {
        isChecked: data.isChecked,
        ...(data.notes !== undefined && { notes: data.notes }),
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
