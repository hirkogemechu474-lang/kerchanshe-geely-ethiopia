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

  async updateSignature(reference: string, data: { signedDocumentUrl: string; signedAt: Date; status: string }) {
    return prisma.quotation.update({ where: { reference }, data });
  },
};
