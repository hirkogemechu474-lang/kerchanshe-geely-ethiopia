import { prisma } from '../../config/database';

export const biSummaryService = {
  async getWorkshopBiSummary(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalJobCards,
        openJobCards,
        completedThisMonth,
        totalRevenue,
        avgCompletionTime,
      ] = await Promise.all([
        prisma.jobCard.count(),
        prisma.jobCard.count({
          where: { status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] } },
        }),
        prisma.jobCard.count({
          where: {
            status: 'INVOICED_CLOSED',
            closeTs: { gte: startOfMonth },
          },
        }),
        prisma.jobCard.aggregate({
          where: { status: 'INVOICED_CLOSED' },
          _sum: { totalAmount: true },
        }),
        prisma.jobCard.findMany({
          where: {
            status: 'INVOICED_CLOSED',
            closeTs: { not: null },
            openTs: { not: null },
          },
          select: { openTs: true, closeTs: true },
          take: 100,
          orderBy: { closeTs: 'desc' },
        }),
      ]);

      let avgDays = 0;
      if (avgCompletionTime.length > 0) {
        const totalDays = avgCompletionTime.reduce((sum, jc) => {
          const diff = jc.closeTs!.getTime() - jc.openTs.getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0);
        avgDays = totalDays / avgCompletionTime.length;
      }

      return {
        ok: true,
        data: {
          totalJobCards,
          openJobCards,
          completedThisMonth,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          avgCompletionDays: Math.round(avgDays * 10) / 10,
        },
      };
    } catch (error: any) {
      console.error('[BI SUMMARY ERROR]', error.message);
      return { ok: false, error: 'Failed to generate BI summary.' };
    }
  },
};
