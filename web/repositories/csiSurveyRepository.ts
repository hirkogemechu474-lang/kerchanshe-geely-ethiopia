/**
 * CsiSurveyRepository — server-only Prisma queries for the post-visit
 * customer satisfaction survey (job card + its CSISurveyResponse).
 */
import { prisma } from '@/lib/prisma';

export const csiSurveyRepository = {
  async findJobCardForEligibility(jobCardId: string) {
    return prisma.jobCard.findUnique({
      where: { id: jobCardId },
      select: {
        id: true,
        jobCardNo: true,
        vehicleModel: true,
        customerName: true,
        status: true,
        csiSurveyResponse: { select: { id: true } },
      },
    });
  },

  async findJobCardForSubmit(jobCardId: string) {
    return prisma.jobCard.findUnique({
      where: { id: jobCardId },
      select: { id: true, status: true, jobCardNo: true, customerName: true, customerEmail: true, vehicleModel: true },
    });
  },

  async createResponse(jobCardId: string, rating: number, comment: string | null) {
    return prisma.cSISurveyResponse.create({
      data: { jobCardId, rating, comment },
    });
  },
};
