import { prisma } from '../../config/database';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';

export interface TradeInEvaluationCreationData {
  leadId: string;
  vin?: string;
  plateNo: string;
  year: number;
  make?: string;
  model?: string;
  color?: string;
  mileage: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  interiorCondition?: string;
  exteriorCondition?: string;
  mechanicalCondition?: string;
  estimatedValue: number;
  estimatedBy: 'sales_agent' | 'manager' | 'finance';
  photoUrls?: string[];
}

export interface TradeInEvaluationUpdateData {
  evaluatedValue?: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedById?: string;
  approvedAt?: Date;
  internalNotes?: string;
}

export interface TradeInEvaluationResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

export class TradeInEvaluationService {
  static async create(data: TradeInEvaluationCreationData): Promise<TradeInEvaluationResponse> {
    try {
      const reference = await generateReference(REFERENCE_CATEGORY.TRADE_IN_EVALUATION);

      const createData: any = {
        leadId: data.leadId,
        vin: data.vin,
        plateNo: data.plateNo,
        year: data.year,
        make: data.make,
        model: data.model,
        color: data.color,
        mileage: data.mileage,
        condition: data.condition,
        interiorCondition: data.interiorCondition,
        exteriorCondition: data.exteriorCondition,
        mechanicalCondition: data.mechanicalCondition,
        estimatedValue: data.estimatedValue,
        estimatedBy: data.estimatedBy,
        photoUrls: data.photoUrls ?? [],
        approvalStatus: 'PENDING',
      };

      const evaluation = await prisma.tradeInEvaluation.create({
        data: createData,
      });

      // Also update the lead to mark trade-in interest
      await prisma.lead.update({
        where: { id: data.leadId },
        data: { tradeInInterest: true },
      });

      return { ok: true, data: evaluation };
    } catch (error: any) {
      console.error('[TRADE-IN EVALUATION CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create trade-in evaluation.' };
    }
  }

  static async updateEvaluation(
    evaluationId: string,
    data: TradeInEvaluationUpdateData
  ): Promise<TradeInEvaluationResponse> {
    try {
      const updateData: any = {
        ...(data.evaluatedValue !== undefined && { evaluatedValue: data.evaluatedValue }),
        approvalStatus: data.approvalStatus,
      };

      if (data.approvedById) updateData.approvedById = data.approvedById;
      if (data.approvedAt) updateData.approvedAt = data.approvedAt;
      if (data.internalNotes) updateData.internalNotes = data.internalNotes;

      const evaluation = await prisma.tradeInEvaluation.update({
        where: { id: evaluationId },
        data: updateData,
      });

      return { ok: true, data: evaluation };
    } catch (error: any) {
      console.error('[TRADE-IN EVALUATION UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update trade-in evaluation.' };
    }
  }

  static async getByLeadId(leadId: string): Promise<TradeInEvaluationResponse> {
    try {
      const evaluation = await prisma.tradeInEvaluation.findFirst({
        where: { leadId },
      });

      if (!evaluation) return { ok: true, data: null };

      return { ok: true, data: evaluation };
    } catch (error: any) {
      console.error('[GET TRADE-IN EVALUATION ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch trade-in evaluation.' };
    }
  }

  static async addInternalNotes(
    evaluationId: string,
    notes: string
  ): Promise<TradeInEvaluationResponse> {
    try {
      const existing = await prisma.tradeInEvaluation.findUnique({
        where: { id: evaluationId },
        select: { internalNotes: true },
      });

      const merged = [existing?.internalNotes, notes]
        .filter(Boolean)
        .join('\n');

      const evaluation = await prisma.tradeInEvaluation.update({
        where: { id: evaluationId },
        data: { internalNotes: merged || null },
      });

      return { ok: true, data: evaluation };
    } catch (error: any) {
      console.error('[ADD INTERNAL NOTES ERROR]', error.message);
      return { ok: false, error: 'Failed to add internal notes.' };
    }
  }
}