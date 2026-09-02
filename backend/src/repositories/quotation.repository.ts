import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const quotationRepository = {
  async findPage(where: Prisma.QuotationWhereInput | undefined, skip: number, take: number) {
    return Promise.all([
      prisma.quotation.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.quotation.count({ where }),
      prisma.quotation.groupBy({ by: ['status'], _count: true }),
    ]);
  },

  async findOpenByPhone(phoneNumber: string) {
    return prisma.quotation.findFirst({
      where: { phoneNumber, status: { notIn: ['converted', 'closed'] } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.QuotationCreateInput) {
    return prisma.quotation.create({ data });
  },

  async findById(id: string) {
    return prisma.quotation.findUnique({ where: { id } });
  },

  async findAssignedTo(id: string) {
    return prisma.quotation.findUnique({ where: { id }, select: { assignedTo: true } });
  },

  async update(id: string, data: Prisma.QuotationUpdateInput) {
    return prisma.quotation.update({ where: { id }, data });
  },

  async updateStatus(id: string, status: string) {
    return prisma.quotation.update({ where: { id }, data: { status } });
  },

  async delete(id: string) {
    return prisma.quotation.delete({ where: { id } });
  },

  async findByIdWithSalesOrder(id: string) {
    return prisma.quotation.findUnique({ where: { id }, include: { salesOrder: true } });
  },

  async findByReference(reference: string) {
    return prisma.quotation.findUnique({ where: { reference } });
  },

  async findByIdWithQuotationMessage(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
    });
  },

  async createWithSalesOrder(data: Prisma.QuotationCreateInput) {
    return prisma.quotation.create({ data, include: { salesOrder: true } });
  },

  async updateSignature(reference: string, data: { signedDocumentUrl: string; signedAt: Date; status: string }) {
    return prisma.quotation.update({ where: { reference }, data });
  },

  async findFirstByMessageContainsWithSalesOrder(messageSubstring: string) {
    return prisma.quotation.findFirst({
      where: { message: { contains: messageSubstring } },
      include: { salesOrder: true },
    });
  },

  async updateMessage(id: string, message: string) {
    return prisma.quotation.update({ where: { id }, data: { message }, include: { salesOrder: true } });
  },

  async findByReferenceForStatus(reference: string) {
    return prisma.quotation.findUnique({
      where: { reference },
      select: {
        status: true, createdAt: true, vehicleModel: true, quotationNo: true,
        salesOrder: { select: { orderNo: true, status: true } },
      },
    });
  },
};
