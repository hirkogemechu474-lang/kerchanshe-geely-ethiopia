import { prisma } from '../../config/database';

export const jobCardPartsService = {
  async requestParts(jobCardId: string, items: Array<{
    sparePartId: string;
    quantity: number;
    unitPrice: number;
    requestedById: string;
  }>): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const parts = await prisma.$transaction(
        items.map((item) =>
          prisma.jobCardPart.create({
            data: {
              jobCardId,
              sparePartId: item.sparePartId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              requestedById: item.requestedById,
              requestedAt: new Date(),
              status: 'REQUESTED',
            },
          })
        )
      );

      return { ok: true, data: parts };
    } catch (error: any) {
      console.error('[JOB CARD PARTS REQUEST ERROR]', error.message);
      return { ok: false, error: 'Failed to request parts.' };
    }
  },

  async issuePart(partId: string, issuedById: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const part = await prisma.jobCardPart.findUnique({
        where: { id: partId },
        include: { sparePart: true },
      });

      if (!part) return { ok: false, error: 'Part request not found.' };

      if (part.sparePart.stock < part.quantity) {
        return { ok: false, error: 'Insufficient stock.' };
      }

      // Use prisma.sparePart.update directly (not sparePartRepository.update) so
      // this returns a PrismaPromise that $transaction can run atomically —
      // an awaited repository call would resolve outside the transaction and
      // let the stock decrement happen even if the part-status update fails.
      const [updatedPart] = await prisma.$transaction([
        prisma.jobCardPart.update({
          where: { id: partId },
          data: { status: 'ISSUED', issuedById, issuedAt: new Date() },
        }),
        prisma.sparePart.update({
          where: { id: part.sparePartId },
          data: { stock: { decrement: part.quantity } },
        }),
      ]);

      return { ok: true, data: updatedPart };
    } catch (error: any) {
      console.error('[JOB CARD PART ISSUE ERROR]', error.message);
      return { ok: false, error: 'Failed to issue part.' };
    }
  },

  async getPartsForJobCard(jobCardId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const parts = await prisma.jobCardPart.findMany({
        where: { jobCardId },
        include: { sparePart: true },
        orderBy: { requestedAt: 'asc' },
      });

      return { ok: true, data: parts };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch parts.' };
    }
  },

  async cancelPartRequest(partId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const updated = await prisma.jobCardPart.update({
        where: { id: partId },
        data: { status: 'CANCELLED' },
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      return { ok: false, error: 'Failed to cancel part request.' };
    }
  },
};
