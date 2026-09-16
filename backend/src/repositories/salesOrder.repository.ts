import { prisma } from '../config/database';
import type { Prisma, OrderStatus, FinancingStatus } from '@prisma/client';

export const salesOrderRepository = {
  async create(data: Prisma.SalesOrderCreateInput) {
    return prisma.salesOrder.create({ data });
  },

  async findById(id: string) {
    return prisma.salesOrder.findUnique({ where: { id } });
  },

  async findByIdWithDetail(id: string) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: {
        pdiItems: { orderBy: { createdAt: 'asc' } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        quotation: { select: { id: true, message: true } },
        testDrives: { orderBy: { createdAt: 'desc' } },
      },
    });
  },

  async findByIdWithPdiItems(id: string) {
    return prisma.salesOrder.findUnique({ where: { id }, include: { pdiItems: true, vehicleAllocation: true } });
  },

  async findPatchGuardFields(id: string) {
    return prisma.salesOrder.findUnique({ where: { id }, select: { commissionStatus: true, approvedAt: true } });
  },

  async findPage(where: Prisma.SalesOrderWhereInput | undefined, skip: number, take: number) {
    return Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          pdiItems: { select: { isChecked: true } },
          quotation: { select: { id: true } },
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take,
      }),
      prisma.salesOrder.count({ where }),
      prisma.salesOrder.groupBy({ by: ['status'], _count: true }),
    ]);
  },

  async update(id: string, data: Prisma.SalesOrderUpdateInput) {
    return prisma.salesOrder.update({ where: { id }, data });
  },

  async transitionStatus(
    id: string,
    orderData: Prisma.SalesOrderUpdateInput,
    historyData: { fromStatus: OrderStatus; toStatus: OrderStatus; changedById: string; reasonCode: string | null }
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.salesOrder.update({ where: { id }, data: orderData });
      await tx.salesOrderStatusHistory.create({ data: { orderId: id, ...historyData } });
      return result;
    });
  },

  async findPdiItem(itemId: string, orderId: string) {
    return prisma.pdiChecklistItem.findFirst({ where: { id: itemId, orderId } });
  },

  async updatePdiItem(itemId: string, data: Prisma.PdiChecklistItemUpdateInput) {
    return prisma.pdiChecklistItem.update({ where: { id: itemId }, data });
  },

  // Handover/Agreement/Invoice PDF data needs: VIN (via allocation), the
  // originating Quotation's number (for cross-refs on the printed
  // documents), and PDI completeness — see orderHandover.service.ts /
  // orderAgreement.service.ts.
  async findByIdWithDocumentDetail(id: string) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: {
        pdiItems: { select: { isChecked: true } },
        quotation: { select: { quotationNo: true } },
        vehicleAllocation: { select: { vin: true } },
      },
    });
  },

  async findByIdWithQuotationMessage(id: string) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: { quotation: { select: { message: true } } },
    });
  },

  async nextOrderNo(): Promise<string> {
    const counter = await prisma.counter.upsert({
      where: { name: 'salesOrder' },
      create: { name: 'salesOrder', value: 1001 },
      update: { value: { increment: 1 } },
    });
    return `SO-${counter.value}`;
  },

  async updateFinancingStatus(id: string, financingStatus: FinancingStatus) {
    return prisma.salesOrder.update({ where: { id }, data: { financingStatus } });
  },

  async updatePaymentStatusPaid(id: string, details?: { paymentMethod?: string; paymentReferenceNo?: string; amountPaid?: number }) {
    return prisma.salesOrder.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        paymentConfirmedAt: new Date(),
        ...(details?.paymentMethod && { paymentMethod: details.paymentMethod }),
        ...(details?.paymentReferenceNo && { paymentReferenceNo: details.paymentReferenceNo }),
        ...(details?.amountPaid != null && { amountPaid: details.amountPaid }),
      },
    });
  },

  async verifyPayment(id: string, verifiedById: string) {
    return prisma.salesOrder.update({ where: { id }, data: { paymentVerifiedAt: new Date(), paymentVerifiedById: verifiedById } });
  },

  async updatePaymentProof(id: string, proofUrl: string) {
    return prisma.salesOrder.update({
      where: { id },
      data: { paymentProofUrl: proofUrl, paymentStatus: 'PENDING_REVIEW', paymentSubmittedAt: new Date() },
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
