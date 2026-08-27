/**
 * SalesOrderRepository — server-only Prisma queries for sales orders, as
 * touched by web's public self-service agreement flow. The full order
 * management surface lives in admin.
 */
import { prisma } from '@/lib/prisma';

export const salesOrderRepository = {
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
};
