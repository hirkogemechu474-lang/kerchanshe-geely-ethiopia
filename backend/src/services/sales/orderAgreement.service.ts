import { salesOrderRepository, vehicleAllocationRepository, userRepository, documentSignatureRepository } from '../../repositories';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';
import { generateSalesAgreementPdf, SalesAgreementPdfData } from '../pdf/salesAgreement.pdf';
import { getCompanyInfo } from '../pdf/companyInfo';
import { dispatchNotification } from '../email/notifications.dispatch';
import { auditService } from '../audit/audit.service';
import { env } from '../../config/env';

async function buildAgreementPdfData(order: any): Promise<SalesAgreementPdfData> {
  const config = (order.configurationJson as Record<string, any> | null) || {};
  const [allocation, sellerSigner] = await Promise.all([
    vehicleAllocationRepository.findByOrderId(order.id),
    order.approvedById ? userRepository.findById(order.approvedById) : Promise.resolve(null),
  ]);
  const managerSigner = order.countersignedById ? await userRepository.findByIdSlim(order.countersignedById) : null;

  return {
    orderNo: order.orderNo,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    vehicleModel: order.vehicleModel,
    color: config.color ?? null,
    exteriorColor: order.exteriorColor,
    interiorColor: order.interiorColor,
    totalPrice: order.totalPrice ?? 0,
    orderDate: order.orderDate ?? order.createdAt,
    salesType: order.salesType,
    vehicleType: order.vehicleType,
    vin: allocation?.vin ?? null,
    motorBatterySerialNo: order.motorBatterySerialNo,
    accessoriesDescription: order.accessoriesDescription,
    proformaInvoiceNo: order.proformaInvoiceNo,
    proformaInvoiceDate: order.proformaInvoiceDate,
    vatAmount: order.vatAmount,
    registrationCharge: order.registrationCharge,
    accessoriesAmount: order.accessoriesAmount,
    purchaserTitle: order.purchaserTitle,
    purchaserTin: order.purchaserTin,
    purchaserAddress: order.purchaserAddress,
    purchaserAuthorizedRep: order.purchaserAuthorizedRep,
    sellerAuthorizedRep: sellerSigner?.name ?? null,
    sellerAuthorizedRepTitle: managerSigner?.title || sellerSigner?.title || null,
    depositAmount: order.depositAmount,
    depositDueDate: order.depositDueDate,
    otherPaymentAmount: order.otherPaymentAmount,
    otherPaymentNote: order.otherPaymentNote,
    otherPaymentDueDate: order.otherPaymentDueDate,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    deliveryLocation: order.deliveryLocation,
    customerSignatureUrl: order.signedDocumentUrl,
    customerSignedAt: order.signedAt,
    managerSignatureUrl: managerSigner?.signatureUrl,
    countersignedByName: managerSigner?.name || sellerSigner?.name,
    countersignedAt: order.countersignedAt,
  };
}

export const orderAgreementService = {
  async getAgreementView(orderId: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!order.approvedAt || !order.agreementSentAt) {
        return { ok: false, error: 'This agreement is not ready for customer review yet.' };
      }

      if (!verifyLinkToken(token, 'agreement', orderId)) {
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
          signedDocumentUrl: order.signedDocumentUrl,
          signedAt: order.signedAt,
          status: order.status,
        },
      };
    } catch (error: any) {
      console.error('[AGREEMENT VIEW ERROR]', error.message);
      return { ok: false, error: 'Failed to load agreement.' };
    }
  },

  async signAgreement(orderId: string, token: string, signedDocumentUrl: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!order.approvedAt || !order.agreementSentAt) {
        return { ok: false, error: 'This agreement is not ready for customer signing yet.' };
      }

      if (!verifyLinkToken(token, 'agreement', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const updated = await salesOrderRepository.updateSignature(orderId, {
        signedDocumentUrl,
        signedAt: new Date(),
      });

      try {
        await documentSignatureRepository.upsert('SALES_AGREEMENT', orderId, 'customer', {
          signedByName: order.customerName,
          signatureUrl: signedDocumentUrl,
        });
      } catch {
        // Signature-log write failure should not block the customer sign flow.
      }

      await auditService.log({
        entityType: 'order',
        entityId: orderId,
        action: 'agreement_customer_signed',
        performedById: 'customer',
        performedByName: order.customerName,
      });

      const assignedAgent = order.salesAgentId ? await userRepository.findById(order.salesAgentId) : null;
      const managerEmails = await userRepository.findManagerEmails();
      const recipients = [assignedAgent?.email, ...managerEmails].filter((email): email is string => Boolean(email));
      if (recipients.length > 0) {
        await dispatchNotification({
          type: 'order_status',
          to: recipients,
          subject: `Customer Signed Agreement — ${order.orderNo}`,
          data: {
            orderNo: order.orderNo,
            customerName: order.customerName,
            vehicleModel: order.vehicleModel,
            nextStep: 'Manager review and countersignature is required before payment.',
            adminLink: `${env.urls.admin}/admin/orders/${order.id}`,
          },
          ctas: [{ label: 'Review Agreement', url: `${env.urls.admin}/admin/orders/${order.id}` }],
          inApp: {
            type: 'signature_required',
            title: 'Customer Signed — Countersignature Required',
            body: `Hello, customer ${order.customerName} has signed the agreement for order ${order.orderNo} (${order.vehicleModel}). Manager countersignature is required before payment can proceed.`,
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
      console.error('[AGREEMENT SIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to sign agreement.' };
    }
  },

  generateAgreementLink(orderId: string): string {
    const token = signLinkToken('agreement', orderId);
    return `/agreement/${orderId}?token=${token}`;
  },

  async generateAgreementPdf(orderId: string, token: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!order.approvedAt || !order.agreementSentAt) {
        return { ok: false, error: 'This agreement is not ready for customer review yet.' };
      }

      if (!verifyLinkToken(token, 'agreement', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const [pdfData, company] = await Promise.all([buildAgreementPdfData(order), getCompanyInfo()]);
      const pdfBuffer = await generateSalesAgreementPdf(pdfData, company);

      return { ok: true, data: pdfBuffer };
    } catch (error: any) {
      console.error('[AGREEMENT PDF ERROR]', error.message);
      return { ok: false, error: 'Failed to generate agreement PDF.' };
    }
  },

  // Staff/admin print path — session-authenticated (requireAdminApiSession),
  // no link token needed, unlike the customer-facing e-sign flow above.
  async generateAgreementPdfForStaff(orderId: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const [pdfData, company] = await Promise.all([buildAgreementPdfData(order), getCompanyInfo()]);
      const pdfBuffer = await generateSalesAgreementPdf(pdfData, company);

      return { ok: true, data: pdfBuffer };
    } catch (error: any) {
      console.error('[AGREEMENT PDF ERROR]', error.message);
      return { ok: false, error: 'Failed to generate agreement PDF.' };
    }
  },
};
