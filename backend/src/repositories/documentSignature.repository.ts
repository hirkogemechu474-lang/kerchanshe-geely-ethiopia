import { prisma } from '../config/database';

// Generic per-document signature ledger — see the DocumentSignature model
// comment in schema.prisma. entityId is a loose reference (Quotation.id or
// SalesOrder.id depending on documentType), matching the approvedById/
// changedById-style actor-reference convention used throughout this schema.
export const documentSignatureRepository = {
  async findMany(documentType: string, entityId: string) {
    return prisma.documentSignature.findMany({
      where: { documentType, entityId },
    });
  },

  // Upserts on the (documentType, entityId, role) unique constraint so
  // re-recording the same role (e.g. a corrected countersign) overwrites
  // rather than duplicates.
  async upsert(
    documentType: string,
    entityId: string,
    role: string,
    data: { signedByName?: string | null; signatureUrl?: string | null; signedByUserId?: string | null }
  ) {
    return prisma.documentSignature.upsert({
      where: { documentType_entityId_role: { documentType, entityId, role } },
      update: { ...data, signedAt: new Date() },
      create: { documentType, entityId, role, ...data },
    });
  },
};
