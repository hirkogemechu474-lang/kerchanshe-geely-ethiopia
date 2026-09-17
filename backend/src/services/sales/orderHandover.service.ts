import { salesOrderRepository, userRepository, documentSignatureRepository } from '../../repositories';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';
import { generateHandoverPdf, HandoverPdfData, HandoverItemRow, InspectionRow, EvGuidanceRow } from '../pdf/handover.pdf';
import { getCompanyInfo } from '../pdf/companyInfo';
import { dispatchNotification } from '../email/notifications.dispatch';
import { env } from '../../config/env';
import { roleLabel } from '../../utils/roleLabels';

async function buildHandoverPdfData(order: any): Promise<HandoverPdfData> {
  const config = (order.configurationJson as Record<string, any> | null) || {};
  const detail = await salesOrderRepository.findByIdWithDocumentDetail(order.id);
  const pdiTotal = detail?.pdiItems?.length ?? 0;
  const pdiChecked = detail?.pdiItems?.filter((p: any) => p.isChecked).length ?? 0;

  // A manager countersigning via the emailed link isn't authenticated, so
  // handoverCountersignedById stays null — fall back to the signature
  // ledger (recorded by name at sign time) so the PDF still credits them.
  let countersignerName: string | null = null;
  let countersignerTitle: string | null = null;
  let countersignerSignatureUrl: string | null = null;
  let countersignerStampUrl: string | null = null;
  if (order.handoverCountersignedById) {
    const countersigner = await userRepository.findByIdSlim(order.handoverCountersignedById);
    countersignerName = countersigner?.name ?? null;
    countersignerTitle = countersigner?.title || roleLabel(countersigner?.role);
    countersignerSignatureUrl = countersigner?.signatureUrl ?? null;
    countersignerStampUrl = countersigner?.stampUrl ?? null;
  } else if (order.handoverCountersignedAt) {
    const signatures = await documentSignatureRepository.findMany('HANDOVER', order.id);
    const managerSignature = signatures.find((s: any) => s.role === 'manager');
    countersignerName = managerSignature?.signedByName ?? null;
    countersignerSignatureUrl = managerSignature?.signatureUrl ?? null;
    if (managerSignature?.signedByUserId) {
      const countersigner = await userRepository.findByIdSlim(managerSignature.signedByUserId);
      countersignerTitle = countersigner?.title || roleLabel(countersigner?.role);
      countersignerStampUrl = countersigner?.stampUrl ?? null;
    }
  }

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
    countersignedByName: countersignerName,
    countersignedByTitle: countersignerTitle,
    countersignedAt: order.handoverCountersignedAt,
    customerSignatureUrl: order.handoverSignedDocumentUrl ?? null,
    managerSignatureUrl: countersignerSignatureUrl,
    managerStampUrl: countersignerStampUrl,
  };
}

export const orderHandoverService = {
  async getHandoverView(orderId: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, ['handover', 'handover-countersign'], orderId)) {
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
          handoverCountersignedAt: order.handoverCountersignedAt,
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

      const assignedAgent = order.salesAgentId ? await userRepository.findById(order.salesAgentId) : null;
      const managerEmails = await userRepository.findManagerEmails();
      const recipients = [assignedAgent?.email, ...managerEmails].filter((email): email is string => Boolean(email));
      if (recipients.length > 0) {
        await dispatchNotification({
          type: 'order_status',
          to: recipients,
          subject: `Customer Signed Handover — ${order.orderNo}`,
          data: {
            orderNo: order.orderNo,
            customerName: order.customerName,
            vehicleModel: order.vehicleModel,
            nextStep: 'Manager countersignature is required to complete the handover.',
            adminLink: `${env.urls.admin}/admin/orders/${order.id}`,
          },
          inApp: {
            type: 'signature_required',
            title: 'Customer Signed Handover — Countersignature Required',
            body: `Hello, customer ${order.customerName} has signed the handover for order ${order.orderNo} (${order.vehicleModel}). Manager countersignature is required to complete the handover.`,
            link: `/admin/orders/${order.id}`,
            orderId: order.id,
            relatedModel: 'order',
            relatedId: order.id,
            priority: 'high',
          },
        });
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

  generateManagerCountersignLink(orderId: string): string {
    const token = signLinkToken('handover-countersign', orderId);
    return `/handover/${orderId}/countersign?token=${token}`;
  },

  async generateHandoverPdf(orderId: string, token: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!verifyLinkToken(token, ['handover', 'handover-countersign'], orderId)) {
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
