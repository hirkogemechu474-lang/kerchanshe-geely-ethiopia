import { salesOrderRepository, vehicleAllocationRepository, userRepository } from '../../repositories';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';
import { generateSalesAgreementPdf, SalesAgreementPdfData } from '../pdf/salesAgreement.pdf';
import { getCompanyInfo } from '../pdf/companyInfo';

async function buildAgreementPdfData(order: any): Promise<SalesAgreementPdfData> {
  const config = (order.configurationJson as Record<string, any> | null) || {};
  const [allocation, sellerSigner] = await Promise.all([
    vehicleAllocationRepository.findByOrderId(order.id),
    order.approvedById ? userRepository.findById(order.approvedById) : Promise.resolve(null),
  ]);

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
    purchaserTin: order.purchaserTin,
    purchaserAddress: order.purchaserAddress,
    purchaserAuthorizedRep: order.purchaserAuthorizedRep,
    sellerAuthorizedRep: sellerSigner?.name ?? null,
    depositAmount: order.depositAmount,
    depositDueDate: order.depositDueDate,
    otherPaymentAmount: order.otherPaymentAmount,
    otherPaymentNote: order.otherPaymentNote,
    otherPaymentDueDate: order.otherPaymentDueDate,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    deliveryLocation: order.deliveryLocation,
  };
}

export const orderAgreementService = {
  async getAgreementView(orderId: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findById(orderId);
      if (!order) return { ok: false, error: 'Order not found.' };

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

      if (!verifyLinkToken(token, 'agreement', orderId)) {
        return { ok: false, error: 'Invalid or expired link.' };
      }

      const updated = await salesOrderRepository.updateSignature(orderId, {
        signedDocumentUrl,
        signedAt: new Date(),
      });

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
