/**
 * SalesOrderRepository — server-only Prisma queries for sales orders, as
 * touched by web's public self-service agreement flow. The full order
 * management surface lives in admin.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, FinancingStatus } from '@prisma/client';

export const salesOrderRepository = {
  // Mirrors admin/lib/services/sales/orderNumber.ts — web can't import
  // across the app boundary, so this is a deliberate parallel copy (same
  // convention as the service-check-in kiosk's own nextJobCardNo()).
  async nextOrderNo(): Promise<string> {
    const counter = await prisma.counter.upsert({
      where: { name: 'salesOrder' },
      create: { name: 'salesOrder', value: 1001 },
      update: { value: { increment: 1 } },
    });
    return `SO-${counter.value}`;
  },

  async create(data: Prisma.SalesOrderCreateInput) {
    return prisma.salesOrder.create({ data });
  },

  async updateFinancingStatus(id: string, financingStatus: FinancingStatus) {
    return prisma.salesOrder.update({ where: { id }, data: { financingStatus } });
  },

  async updatePaymentStatusPaid(id: string) {
    return prisma.salesOrder.update({ where: { id }, data: { paymentStatus: 'PAID', paymentConfirmedAt: new Date() } });
  },

  async updatePaymentProof(id: string, proofUrl: string) {
    return prisma.salesOrder.update({
      where: { id },
      data: { paymentProofUrl: proofUrl, paymentStatus: 'PENDING_REVIEW', paymentSubmittedAt: new Date() },
    });
  },
  async findById(id: string) {
    return prisma.salesOrder.findUnique({ where: { id } });
  },

  async findByIdWithQuotationMessage(id: string) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: { quotation: { select: { message: true } } },
    });
  },

  async updateSignature(id: string, data: { signedDocumentUrl: string; signedAt: Date }) {
    return prisma.salesOrder.update({ where: { id }, data });
  },

  async updateHandoverSignature(id: string, data: { handoverSignedDocumentUrl: string; handoverSignedAt: Date }) {
    return prisma.salesOrder.update({ where: { id }, data });
  },

  async findByOrderNoForStatus(orderNo: string) {
    return prisma.salesOrder.findUnique({
      where: { orderNo },
      select: { status: true, createdAt: true, vehicleModel: true },
    });
  },
};
