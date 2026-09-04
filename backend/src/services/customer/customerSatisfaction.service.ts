import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

export const customerSatisfactionService = {
  /**
   * Schedule post-delivery follow-up calls.
   * Typically: 3 days (initial check), 30 days (satisfaction), 90 days (loyalty).
   */
  async scheduleFollowUp(
    orderId: string,
    followUpType: 'INITIAL_CHECK' | 'SATISFACTION' | 'LOYALTY' | 'SERVICE_REMINDER',
    scheduledDate: Date,
    assignedTo?: string
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false, error: 'Order not found.' };

      // Check if this follow-up type already scheduled
      const existing = await prisma.$queryRaw<any[]>`
        SELECT * FROM "CustomerFollowUp"
        WHERE "orderId" = ${orderId} AND "followUpType" = ${followUpType} AND status IN ('SCHEDULED', 'IN_PROGRESS')
        LIMIT 1
      `;

      if (existing && existing.length > 0) {
        return { ok: false, error: `Follow-up of type ${followUpType} already scheduled.` };
      }

      const followUp = await prisma.$executeRaw`
        INSERT INTO "CustomerFollowUp" (id, "orderId", "followUpType", "scheduledDate", "assignedTo", status, "createdAt")
        VALUES (gen_random_uuid(), ${orderId}, ${followUpType}, ${scheduledDate}, ${assignedTo || null}, 'SCHEDULED', NOW())
      `;

      return { ok: true, data: { orderId, followUpType, scheduledDate } };
    } catch (error: any) {
      console.error('[FOLLOW-UP SCHEDULE ERROR]', error.message);
      return { ok: false, error: 'Failed to schedule follow-up.' };
    }
  },

  /**
   * Auto-schedule all post-delivery follow-ups when order is delivered.
   */
  async schedulePostDeliveryFollowUps(orderId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false, error: 'Order not found.' };

      const deliveryDate = order.deliveredAt || new Date();

      // 3-day initial check
      const initialCheck = new Date(deliveryDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      await this.scheduleFollowUp(orderId, 'INITIAL_CHECK', initialCheck, order.salesAgentId || undefined);

      // 30-day satisfaction survey
      const satisfactionDate = new Date(deliveryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.scheduleFollowUp(orderId, 'SATISFACTION', satisfactionDate, order.salesAgentId || undefined);

      // 90-day loyalty check
      const loyaltyDate = new Date(deliveryDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      await this.scheduleFollowUp(orderId, 'LOYALTY', loyaltyDate, order.salesAgentId || undefined);

      return { ok: true };
    } catch (error: any) {
      console.error('[AUTO SCHEDULE FOLLOW-UPS ERROR]', error.message);
      return { ok: false, error: 'Failed to auto-schedule follow-ups.' };
    }
  },

  /**
   * Complete a follow-up call with outcome and NPS score.
   */
  async completeFollowUp(
    followUpId: string,
    data: {
      outcome: 'COMPLETED' | 'NO_ANSWER' | 'WRONG_NUMBER' | 'REQUESTED_CALLBACK';
      notes?: string;
      npsScore?: number; // 0-10
      satisfactionScore?: number; // 1-5
      wouldRecommend?: boolean;
      callbackDate?: Date;
    }
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      await prisma.$executeRaw`
        UPDATE "CustomerFollowUp"
        SET status = ${data.outcome}, notes = ${data.notes || null},
            "npsScore" = ${data.npsScore ?? null}, "satisfactionScore" = ${data.satisfactionScore ?? null},
            "wouldRecommend" = ${data.wouldRecommend ?? null},
            "completedAt" = NOW(), "callbackDate" = ${data.callbackDate || null}
        WHERE id = ${followUpId}
      `;

      // If NPS is provided, also update/create the NPS record
      if (data.npsScore !== undefined) {
        const followUp = await prisma.$queryRaw<any[]>`SELECT "orderId" FROM "CustomerFollowUp" WHERE id = ${followUpId} LIMIT 1`;
        if (followUp && followUp.length > 0) {
          await prisma.$executeRaw`
            INSERT INTO "CustomerNPS" (id, "orderId", "npsScore", "satisfactionScore", "wouldRecommend", "recordedAt")
            VALUES (gen_random_uuid(), ${followUp[0].orderId}, ${data.npsScore}, ${data.satisfactionScore ?? null}, ${data.wouldRecommend ?? null}, NOW())
            ON CONFLICT ("orderId") DO UPDATE SET "npsScore" = ${data.npsScore}, "satisfactionScore" = ${data.satisfactionScore ?? null}, "wouldRecommend" = ${data.wouldRecommend ?? null}, "recordedAt" = NOW()
          `;
        }
      }

      // Schedule callback if requested
      if (data.outcome === 'REQUESTED_CALLBACK' && data.callbackDate) {
        const followUpInfo = await prisma.$queryRaw<any[]>`SELECT "orderId", "assignedTo" FROM "CustomerFollowUp" WHERE id = ${followUpId} LIMIT 1`;
        if (followUpInfo && followUpInfo.length > 0) {
          await this.scheduleFollowUp(followUpInfo[0].orderId, 'SERVICE_REMINDER', data.callbackDate, followUpInfo[0].assignedTo);
        }
      }

      return { ok: true };
    } catch (error: any) {
      console.error('[COMPLETE FOLLOW-UP ERROR]', error.message);
      return { ok: false, error: 'Failed to complete follow-up.' };
    }
  },

  /**
   * Get NPS dashboard metrics.
   */
  async getNPSMetrics(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const allNPS = await prisma.$queryRaw<any[]>`
        SELECT "npsScore", "satisfactionScore", "wouldRecommend" FROM "CustomerNPS"
      `;

      if (!allNPS || allNPS.length === 0) {
        return { ok: true, data: { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0, satisfactionAvg: 0 } };
      }

      const promoters = allNPS.filter(n => n.npsScore >= 9).length;
      const passives = allNPS.filter(n => n.npsScore >= 7 && n.npsScore <= 8).length;
      const detractors = allNPS.filter(n => n.npsScore <= 6).length;
      const total = allNPS.length;
      const nps = Math.round(((promoters - detractors) / total) * 100);
      const satisfactionAvg = allNPS.reduce((sum, n) => sum + (n.satisfactionScore || 0), 0) / total;

      return {
        ok: true,
        data: { nps, promoters, passives, detractors, total, satisfactionAvg: Math.round(satisfactionAvg * 10) / 10 },
      };
    } catch (error: any) {
      console.error('[NPS METRICS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch NPS metrics.' };
    }
  },

  /**
   * Get pending follow-ups for an agent.
   */
  async getPendingFollowUps(agentId?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } };
      if (agentId) where.assignedTo = agentId;

      const followUps = await prisma.$queryRaw<any[]>`
        SELECT f.*, o."orderNo", o."customerName", o."vehicleModel"
        FROM "CustomerFollowUp" f
        JOIN "SalesOrder" o ON f."orderId" = o.id
        WHERE f.status IN ('SCHEDULED', 'IN_PROGRESS')
        ${agentId ? prisma.$queryRaw`AND f."assignedTo" = ${agentId}` : prisma.$queryRaw``}
        ORDER BY f."scheduledDate" ASC
        LIMIT 50
      `;

      return { ok: true, data: followUps };
    } catch (error: any) {
      console.error('[PENDING FOLLOW-UPS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch pending follow-ups.' };
    }
  },

  /**
   * Calculate customer retention score based on service history and satisfaction.
   */
  async calculateRetentionScore(customerId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) return { ok: false, error: 'Customer not found.' };

      // Get all orders and NPS
      const [orders, nps] = await Promise.all([
        prisma.salesOrder.findMany({
          where: { customerPhone: customer.phone },
          select: { id: true, status: true, deliveredAt: true, createdAt: true },
        }),
        prisma.$queryRaw<any[]>`SELECT "npsScore" FROM "CustomerNPS" WHERE "orderId" IN (SELECT id FROM "SalesOrder" WHERE "customerPhone" = ${customer.phone})`,
      ]);

      let score = 50; // Base score

      // +10 for each delivered order
      score += orders.filter(o => o.status === 'DELIVERED').length * 10;

      // +5 for recent NPS >= 9
      if (nps && nps.length > 0) {
        const latestNPS = nps[0].npsScore;
        if (latestNPS >= 9) score += 15;
        else if (latestNPS >= 7) score += 5;
        else if (latestNPS <= 6) score -= 10;
      }

      // +5 for service history
      const customerVehicles = await prisma.customerVehicle.findMany({
        where: { customerId: customer.id },
        select: { id: true },
      });
      const jobCards = await prisma.jobCard.count({
        where: {
          customerVehicleId: { in: customerVehicles.map((v) => v.id) },
        },
      });
      score += Math.min(jobCards * 2, 10);

      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));

      let retentionLevel: string;
      if (score >= 80) retentionLevel = 'CHAMPION';
      else if (score >= 60) retentionLevel = 'LOYAL';
      else if (score >= 40) retentionLevel = 'AT_RISK';
      else retentionLevel = 'CHURNING';

      return {
        ok: true,
        data: { customerId, score, retentionLevel, ordersCount: orders.length, jobCardsCount: jobCards },
      };
    } catch (error: any) {
      console.error('[RETENTION SCORE ERROR]', error.message);
      return { ok: false, error: 'Failed to calculate retention score.' };
    }
  },
};