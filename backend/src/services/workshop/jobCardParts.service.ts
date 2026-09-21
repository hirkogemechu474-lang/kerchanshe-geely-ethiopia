import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

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

      try {
        if (part.requestedById) {
          const requester = await prisma.user.findUnique({ where: { id: part.requestedById } });
          if (requester?.email) {
            const jobCard = await prisma.jobCard.findUnique({
              where: { id: part.jobCardId },
              select: { jobCardNo: true, customerName: true, vehicleModel: true },
            });
            await dispatchNotification({
              type: 'job_card_status',
              to: [requester.email],
              subject: `Part Issued — ${part.sparePart.name} (${jobCard?.jobCardNo ?? 'N/A'})`,
              data: {
                jobCardNo: jobCard?.jobCardNo ?? 'N/A',
                partName: part.sparePart.name,
                quantity: part.quantity,
                customerName: jobCard?.customerName,
                vehicleModel: jobCard?.vehicleModel,
              },
              inApp: {
                type: 'job_card_status',
                title: 'Part Issued',
                body: `${part.sparePart.name} (x${part.quantity}) issued for job card ${jobCard?.jobCardNo ?? 'N/A'}.`,
                link: `/admin/workshop/job-cards/${part.jobCardId}`,
                relatedModel: 'jobCard',
                relatedId: part.jobCardId,
                priority: 'normal',
              },
            });
          }
        }
      } catch (notifyError: any) {
        console.error('[JOB CARD PART ISSUED NOTIFICATION ERROR]', notifyError.message);
      }

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
