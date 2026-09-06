import { salesOrderRepository, userRepository, documentSignatureRepository } from '../../repositories';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';
import { generateHandoverPdf, HandoverPdfData, HandoverItemRow, InspectionRow, EvGuidanceRow } from '../pdf/handover.pdf';
import { getCompanyInfo } from '../pdf/companyInfo';

async function buildHandoverPdfData(order: any): Promise<HandoverPdfData> {
  const config = (order.configurationJson as Record<string, any> | null) || {};
  const detail = await salesOrderRepository.findByIdWithDocumentDetail(order.id);
  const countersigner = order.handoverCountersignedById ? await userRepository.findById(order.handoverCountersignedById) : null;
  const pdiTotal = detail?.pdiItems?.length ?? 0;
  const pdiChecked = detail?.pdiItems?.filter((p: any) => p.isChecked).length ?? 0;

  return {
    orderNo: order.orderNo,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerTin: order.purchaserTin,
    customerAddress: order.purchaserAddress,
    customerTitle: order.customerTitle,
    vehicleModel: order.vehicleModel,
    color: config.color ?? null,
    exteriorColor: order.exteriorColor,
    interiorColor: order.interiorColor,
    vehicleVariant: config.variant ?? null,
    vin: detail?.vehicleAllocation?.vin ?? null,
    motorBatterySerialNo: order.motorBatterySerialNo,
    odometerAtDelivery: order.odometerAtDelivery,
    registrationNumber: order.registrationNumber,
    registeredAt: order.registeredAt,
    pdiComplete: pdiTotal > 0 && pdiChecked === pdiTotal,
    deliveryNoteNo: order.deliveryNoteNo,
    invoiceNo: order.invoiceNo,
    quotationNo: detail?.quotation?.quotationNo ?? null,
    salesType: order.salesType,
    deliveryLocation: order.deliveryLocation,
    salesExecutiveName: order.salesAgentId,
    itemsHandedOver: (order.itemsHandedOver as HandoverItemRow[] | null) ?? null,
    inspectionChecklist: (order.inspectionChecklist as InspectionRow[] | null) ?? null,
    evGuidanceChecklist: (order.evGuidanceChecklist as EvGuidanceRow[] | null) ?? null,
    handoverDamageNotes: order.handoverDamageNotes,
    handoverOutstandingItems: order.handoverOutstandingItems,
    handoverResponsiblePerson: order.handoverResponsiblePerson,
    handoverExpectedCompletionDate: order.handoverExpectedCompletionDate,
    handoverDate: (order.deliveredAt ?? order.handoverSignedAt) ? String(order.deliveredAt ?? order.handoverSignedAt) : new Date().toISOString(),
    handoverSignedAt: order.handoverSignedAt,
    countersignedByName: countersigner?.name ?? null,
  };
}

export const orderHandoverService = {
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

      try {
        await documentSignatureRepository.upsert('HANDOVER', orderId, 'customer', {
          signedByName: order.customerName,
          signatureUrl: handoverSignedDocumentUrl,
        });
      } catch {
        // Signature-log write failure should not block the customer sign flow.
      }

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

  async generateHandoverPdf(orderId: string, token: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, 'handover', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const [pdfData, company] = await Promise.all([buildHandoverPdfData(order), getCompanyInfo()]);
      const pdfBuffer = await generateHandoverPdf(pdfData, company);

      return { ok: true, data: pdfBuffer };
    } catch (error: any) {
      console.error('[HANDOVER PDF ERROR]', error.message);
      return { ok: false, error: 'Failed to generate handover PDF.' };
    }
  },

  // Staff/admin print path — session-authenticated, no link token needed.
  async generateHandoverPdfForStaff(orderId: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const [pdfData, company] = await Promise.all([buildHandoverPdfData(order), getCompanyInfo()]);
      const pdfBuffer = await generateHandoverPdf(pdfData, company);

      return { ok: true, data: pdfBuffer };
    } catch (error: any) {
      console.error('[HANDOVER PDF ERROR]', error.message);
      return { ok: false, error: 'Failed to generate handover PDF.' };
    }
  },
};
