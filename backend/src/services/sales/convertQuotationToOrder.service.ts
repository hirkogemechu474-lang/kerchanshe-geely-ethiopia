import { quotationRepository, salesOrderRepository, vehicleRepository } from '../../repositories';
import { vehicleAllocationService } from './vehicleAllocation.service';
import { auditService } from '../audit/audit.service';

export const convertQuotationToOrderService = {
  async convert(quotationId: string, assignedTo?: string, performedById?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const quotation = await quotationRepository.findById(quotationId);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };

      if (quotation.status === 'converted') {
        return { ok: false, error: 'Quotation has already been converted.' };
      }

      if (quotation.status === 'closed') {
        return { ok: false, error: 'Cannot convert a closed quotation.' };
      }

      if (quotation.managerApprovalStatus !== 'APPROVED') {
        return { ok: false, error: 'Quotation must be approved by a manager before conversion.' };
      }

      if (quotation.status !== 'accepted' || !quotation.signedDocumentUrl) {
        return { ok: false, error: 'Customer must sign the quotation before conversion.' };
      }

      // vehicleModel is optional on Quotation (UC-01: a general enquiry with
      // no vehicle chosen yet) but required on SalesOrder — nothing else to
      // convert into an order without one.
      if (!quotation.vehicleModel) {
        return { ok: false, error: 'This is a general enquiry with no vehicle selected — nothing to convert into an order.' };
      }

      // Quotation has no `totalPrice`/`totalAmount` column — the structured
      // price lives across unitPrice/quantity/discountAmount/vatAmount (see
      // QuotationPdfPanel.tsx, which computes the same total client-side).
      const totalPrice = quotation.unitPrice != null
        ? quotation.unitPrice * (quotation.quantity ?? 1) - (quotation.discountAmount ?? 0) + (quotation.vatAmount ?? 0)
        : null;

      const orderNo = await salesOrderRepository.nextOrderNo();
      const salesAgentId = assignedTo || quotation.assignedTo;

      const order = await salesOrderRepository.create({
        orderNo,
        customerName: quotation.customerName,
        customerPhone: quotation.phoneNumber,
        customerEmail: quotation.email,
        vehicleModel: quotation.vehicleModel,
        // Carried over from Quotation.configurationJson at conversion time —
        // same shape, same nullability (see SalesOrder.configurationJson's
        // doc comment in schema.prisma).
        configurationJson: quotation.configurationJson ?? undefined,
        totalPrice,
        status: 'BOOKED',
        paymentStatus: 'UNPAID',
        financingStatus: quotation.financingInterest ? 'REQUESTED' : 'NOT_REQUESTED',
        orderDate: new Date(),
        // Carry over agreement/invoice fields from Quotation to SalesOrder
        salesType: quotation.salesType ?? undefined,
        purchaserTitle: quotation.title ?? undefined,
        purchaserTin: quotation.customerTin ?? undefined,
        purchaserAddress: quotation.customerAddress ?? undefined,
        exteriorColor: quotation.vehicleColor ?? undefined,
        interiorColor: quotation.vehicleVariant ?? undefined,
        deliveryLocation: quotation.deliveryLocation ?? undefined,
        depositAmount: quotation.depositAmount ?? undefined,
        depositDueDate: quotation.depositDueDate ?? undefined,
        // SalesOrder's equivalent of Quotation.assignedTo is salesAgentId
        // (same free-text-actor-reference convention — see its doc comment).
        // commissionStatus per its own doc comment: "PENDING once a
        // salesAgentId is set".
        ...(salesAgentId && { salesAgentId, commissionStatus: 'PENDING' }),
        quotation: { connect: { id: quotationId } },
      });

      // Auto-allocate an available vehicle of the same model if one exists
      const availableVehicle = await vehicleRepository.findAvailableByName(quotation.vehicleModel);
      if (availableVehicle) {
        await vehicleAllocationService.allocate(order.id, availableVehicle.id);
      }

      await quotationRepository.update(quotationId, {
        status: 'converted',
        salesOrder: { connect: { id: order.id } },
      });

      // PDI checklist is seeded once a vehicle is actually allocated (see
      // vehicleAllocationService.lockAllocation), not here — the
      // auto-allocation above only reserves a stock unit, it doesn't lock a
      // specific VIN yet.
      await auditService.log({
        entityType: 'quotation',
        entityId: quotationId,
        action: 'converted',
        performedById: performedById || salesAgentId || 'system',
        toValue: { orderId: order.id, orderNo: order.orderNo },
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
