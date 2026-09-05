import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';
import { userRepository } from '../../repositories';

export interface SLADefinition {
  stage: string;
  maxMinutes: number;
  escalateAfterMinutes?: number;
  notifyEmails?: string[];
  /** If true, resolve notifyEmails dynamically from manager users instead of using static list */
  useManagerRole?: boolean;
}

export const slaDefinitions: SLADefinition[] = [
  { stage: 'LEAD_RESPONSE', maxMinutes: 60, escalateAfterMinutes: 45, useManagerRole: true },
  { stage: 'QUOTATION_APPROVAL', maxMinutes: 240, escalateAfterMinutes: 180, useManagerRole: true },
  { stage: 'QUOTATION_SENT', maxMinutes: 1440, escalateAfterMinutes: 1200 }, // 24h / 20h
  { stage: 'PAYMENT_CONFIRMATION', maxMinutes: 480, escalateAfterMinutes: 360, notifyEmails: ['finance@geelyethiopia.com'] },
  { stage: 'DISCOUNT_APPROVAL', maxMinutes: 240, escalateAfterMinutes: 180, useManagerRole: true },
  { stage: 'AGREEMENT_REVIEW', maxMinutes: 480, escalateAfterMinutes: 360, useManagerRole: true },
  { stage: 'PDI_COMPLETION', maxMinutes: 480, escalateAfterMinutes: 360, notifyEmails: ['workshop@geelyethiopia.com'] },
  { stage: 'REGISTRATION', maxMinutes: 1440, escalateAfterMinutes: 1200 },
  { stage: 'INVOICE_GENERATION', maxMinutes: 480, escalateAfterMinutes: 360, notifyEmails: ['finance@geelyethiopia.com'] },
  { stage: 'DELIVERY_SCHEDULING', maxMinutes: 480, escalateAfterMinutes: 360 },
  { stage: 'FOLLOW_UP', maxMinutes: 10080, escalateAfterMinutes: 7200 }, // 7 days / 5 days
];

async function resolveNotifyEmails(definition: SLADefinition): Promise<string[]> {
  if (definition.useManagerRole) {
    return userRepository.findManagerEmails();
  }
  return definition.notifyEmails || [];
}

export const slaTimerService = {
  /**
   * Start an SLA timer when entering a new stage.
   */
  async startTimer(
    entityType: string,
    entityId: string,
    stage: string,
    assignedTo?: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const definition = slaDefinitions.find(d => d.stage === stage);
      if (!definition) return { ok: false, error: `Unknown SLA stage: ${stage}` };

      const startTime = new Date();
      const deadline = new Date(startTime.getTime() + definition.maxMinutes * 60 * 1000);
      const escalateAt = definition.escalateAfterMinutes
        ? new Date(startTime.getTime() + definition.escalateAfterMinutes * 60 * 1000)
        : null;

      // Use raw SQL since SLA model may not exist yet
      await prisma.$executeRaw`
        INSERT INTO "SLATimer" (id, "entityType", "entityId", stage, "startTime", deadline, "escalateAt", "assignedTo", status, "createdAt")
        VALUES (gen_random_uuid(), ${entityType}, ${entityId}, ${stage}, ${startTime}, ${deadline}, ${escalateAt}, ${assignedTo || null}, 'ACTIVE', NOW())
      `;

      return { ok: true };
    } catch (error: any) {
      console.error('[SLA START ERROR]', error.message);
      return { ok: false, error: 'Failed to start SLA timer.' };
    }
  },

  /**
   * Complete an SLA timer when the stage is finished.
   */
  async completeTimer(
    entityType: string,
    entityId: string,
    stage: string
  ): Promise<{ ok: boolean; withinSLA?: boolean; minutesTaken?: number; error?: string }> {
    try {
      const completionTime = new Date();

      // Find the active timer
      const timers = await prisma.$queryRaw<any[]>`
        SELECT * FROM "SLATimer"
        WHERE "entityType" = ${entityType} AND "entityId" = ${entityId} AND stage = ${stage} AND status = 'ACTIVE'
        LIMIT 1
      `;

      if (!timers || timers.length === 0) {
        return { ok: false, error: 'No active SLA timer found.' };
      }

      const timer = timers[0];
      const startTime = new Date(timer.startTime);
      const deadline = new Date(timer.deadline);
      const minutesTaken = Math.round((completionTime.getTime() - startTime.getTime()) / (1000 * 60));
      const withinSLA = completionTime <= deadline;

      await prisma.$executeRaw`
        UPDATE "SLATimer"
        SET status = ${withinSLA ? 'COMPLETED' : 'BREACHED'}, "completedAt" = ${completionTime}, "minutesTaken" = ${minutesTaken}
        WHERE id = ${timer.id}
      `;

      return { ok: true, withinSLA, minutesTaken };
    } catch (error: any) {
      console.error('[SLA COMPLETE ERROR]', error.message);
      return { ok: false, error: 'Failed to complete SLA timer.' };
    }
  },

  /**
   * Check for breached SLAs and escalate.
   */
  async checkBreachedSLAs(): Promise<{ ok: boolean; breachedCount: number; escalatedCount: number }> {
    try {
      const now = new Date();

      // Find active timers that have breached
      const breached = await prisma.$queryRaw<any[]>`
        SELECT * FROM "SLATimer"
        WHERE status = 'ACTIVE' AND deadline < ${now}
      `;

      let escalatedCount = 0;

      for (const timer of breached) {
        // Mark as breached
        await prisma.$executeRaw`
          UPDATE "SLATimer" SET status = 'BREACHED', "completedAt" = ${now} WHERE id = ${timer.id}
        `;

        // Send escalation notification
        const definition = slaDefinitions.find(d => d.stage === timer.stage);
        if (definition) {
          const notifyEmails = await resolveNotifyEmails(definition);
          if (notifyEmails.length > 0) {
            await dispatchNotification({
              type: 'sla_breach',
              to: notifyEmails,
              subject: `SLA Breached: ${timer.stage} on ${timer.entityType} ${timer.entityId}`,
              data: {
                entityType: timer.entityType,
                entityId: timer.entityId,
                stage: timer.stage,
                deadline: timer.deadline,
                assignedTo: timer.assignedTo,
              },
            });
            escalatedCount++;
          }
        }
      }

      return { ok: true, breachedCount: breached.length, escalatedCount };
    } catch (error: any) {
      console.error('[SLA CHECK ERROR]', error.message);
      return { ok: false, breachedCount: 0, escalatedCount: 0 };
    }
  },

  /**
   * Get SLA status for an entity.
   */
  async getSLAStatus(
    entityType: string,
    entityId: string
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const timers = await prisma.$queryRaw<any[]>`
        SELECT * FROM "SLATimer"
        WHERE "entityType" = ${entityType} AND "entityId" = ${entityId}
        ORDER BY "startTime" DESC
      `;

      return { ok: true, data: timers };
    } catch (error: any) {
      console.error('[SLA STATUS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch SLA status.' };
    }
  },

  /**
   * Get SLA dashboard metrics.
   */
  async getSLADashboard(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();

      const [active, breached, completed] = await Promise.all([
        prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM "SLATimer" WHERE status = 'ACTIVE'`,
        prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM "SLATimer" WHERE status = 'BREACHED'`,
        prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM "SLATimer" WHERE status = 'COMPLETED'`,
      ]);

      const activeCount = Array.isArray(active) && active[0] ? parseInt(active[0].count) : 0;
      const breachedCount = Array.isArray(breached) && breached[0] ? parseInt(breached[0].count) : 0;
      const completedCount = Array.isArray(completed) && completed[0] ? parseInt(completed[0].count) : 0;

      return {
        ok: true,
        data: {
          active: activeCount,
          breached: breachedCount,
          completed: completedCount,
          complianceRate: completedCount + breachedCount > 0
            ? Math.round((completedCount / (completedCount + breachedCount)) * 100)
            : 100,
        },
      };
    } catch (error: any) {
      console.error('[SLA DASHBOARD ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch SLA dashboard.' };
    }
  },
};