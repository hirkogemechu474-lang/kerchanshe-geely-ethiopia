/**
 * QuotationRepository — server-only Prisma queries for quotations.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const quotationRepository = {
  async findByReference(reference: string) {
    return prisma.quotation.findUnique({ where: { reference } });
  },

  async findById(id: string) {
    return prisma.quotation.findUnique({ where: { id } });
  },

  async create(data: Prisma.QuotationCreateInput) {
    return prisma.quotation.create({ data });
  },

  /** Same as create(), but also returns the (always-null-on-a-fresh-row)
   *  salesOrder relation, so callers that branch on quotation.salesOrder
   *  don't need a separate lookup. */
  async createWithSalesOrder(data: Prisma.QuotationCreateInput) {
    return prisma.quotation.create({ data, include: { salesOrder: true } });
  },

  async updateSignature(reference: string, data: { signedDocumentUrl: string; signedAt: Date; status: string }) {
    return prisma.quotation.update({ where: { reference }, data });
  },

  async findByIdWithSalesOrder(id: string) {
    return prisma.quotation.findUnique({ where: { id }, include: { salesOrder: true } });
  },

  /** Purchase-pipeline correlation: a Quotation's message embeds
   *  "Purchase reference: <id>" text since Message has no structured FK
   *  to its SalesOrder — see linkPurchaseToSalesPipeline. */
  async findFirstByMessageContainsWithSalesOrder(messageSubstring: string) {
    return prisma.quotation.findFirst({
      where: { message: { contains: messageSubstring } },
      include: { salesOrder: true },
    });
  },

  async updateMessage(id: string, message: string) {
    return prisma.quotation.update({ where: { id }, data: { message }, include: { salesOrder: true } });
  },

  async updateStatus(id: string, status: string) {
    return prisma.quotation.update({ where: { id }, data: { status } });
  },

  async findByReferenceForStatus(reference: string) {
    return prisma.quotation.findUnique({
      where: { reference },
      select: {
        status: true,
        createdAt: true,
        vehicleModel: true,
        quotationNo: true,
        salesOrder: { select: { orderNo: true, status: true } },
      },
    });
  },
};
