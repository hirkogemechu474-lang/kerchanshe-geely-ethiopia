import { quotationRepository, salesOrderRepository } from '../../repositories';
import { orderStateMachine } from './order.service';

export const convertQuotationToOrderService = {
  async convert(quotationId: string, assignedTo?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.findById(quotationId);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };

      if (quotation.status === 'converted') {
        return { ok: false, error: 'Quotation has already been converted.' };
      }

      if (quotation.status === 'closed') {
        return { ok: false, error: 'Cannot convert a closed quotation.' };
      }

      const orderNo = await salesOrderRepository.nextOrderNo();

      const order = await salesOrderRepository.create({
        orderNo,
        customerName: quotation.customerName,
        customerPhone: quotation.phoneNumber,
        customerEmail: quotation.email,
        vehicleModel: quotation.vehicleModel,
        vehicleId: quotation.vehicleId,
        totalPrice: quotation.totalPrice || 0,
        status: 'BOOKED',
        paymentStatus: 'UNPAID',
        financingStatus: 'NOT_APPLICABLE',
        orderDate: new Date(),
        assignedTo: assignedTo || quotation.assignedTo,
        quotation: { connect: { id: quotationId } },
      });

      await quotationRepository.update(quotationId, {
        status: 'converted',
        salesOrder: { connect: { id: order.id } },
      });

      return { ok: true, data: order };
    } catch (error: any) {
      console.error('[CONVERT QUOTATION ERROR]', error.message);
      return { ok: false, error: 'Failed to convert quotation to order.' };
    }
  },

  async getStatusByReference(reference: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.findByReferenceForStatus(reference);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };
      return { ok: true, data: quotation };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch status.' };
    }
  },

  async getOrderStatusByOrderNo(orderNo: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByOrderNoForStatus(orderNo);
      if (!order) return { ok: false, error: 'Order not found.' };
      return { ok: true, data: order };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch order status.' };
    }
  },
};
