import { prisma } from '../../config/database';

export interface AuditLogEntry {
  entityType: string; // quotation, order, lead, warranty, etc.
  entityId: string;
  action: string; // created, updated, status_changed, assigned, escalated, etc.
  performedById: string;
  performedByName?: string;
  fromValue?: any;
  toValue?: any;
  reason?: string;
  metadata?: Record<string, any>;
}

export const auditService = {
  /**
   * Log an audit event.
   */
  async log(entry: AuditLogEntry): Promise<{ ok: boolean; error?: string }> {
    try {
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" (id, "entityType", "entityId", action, "performedById", "performedByName", "fromValue", "toValue", reason, metadata, "createdAt")
        VALUES (
          gen_random_uuid(),
          ${entry.entityType},
          ${entry.entityId},
          ${entry.action},
          ${entry.performedById},
          ${entry.performedByName || null},
          ${entry.fromValue ? JSON.stringify(entry.fromValue) : null}::jsonb,
          ${entry.toValue ? JSON.stringify(entry.toValue) : null}::jsonb,
          ${entry.reason || null},
          ${entry.metadata ? JSON.stringify(entry.metadata) : null}::jsonb,
          NOW()
        )
      `;
      return { ok: true };
    } catch (error: any) {
      console.error('[AUDIT LOG ERROR]', error.message);
      return { ok: false, error: 'Failed to write audit log.' };
    }
  },

  /**
   * Get audit trail for an entity.
   */
  async getTrail(entityType: string, entityId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const entries = await prisma.$queryRaw<any[]>`
        SELECT * FROM "AuditLog"
        WHERE "entityType" = ${entityType} AND "entityId" = ${entityId}
        ORDER BY "createdAt" DESC
        LIMIT 100
      `;

      return { ok: true, data: entries };
    } catch (error: any) {
      console.error('[AUDIT TRAIL ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch audit trail.' };
    }
  },

  /**
   * Get recent audit activity across all entities.
   */
  async getRecentActivity(params: {
    entityType?: string;
    performedById?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 50;
      const offset = (page - 1) * pageSize;

      let whereClause = '';
      const conditions: string[] = [];

      // Note: Using raw SQL with parameterized queries for safety
      let entries: any[];
      let total: any[];

      if (params.entityType && params.performedById) {
        entries = await prisma.$queryRaw<any[]>`
          SELECT * FROM "AuditLog"
          WHERE "entityType" = ${params.entityType} AND "performedById" = ${params.performedById}
          ORDER BY "createdAt" DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
        total = await prisma.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM "AuditLog"
          WHERE "entityType" = ${params.entityType} AND "performedById" = ${params.performedById}
        `;
      } else if (params.entityType) {
        entries = await prisma.$queryRaw<any[]>`
          SELECT * FROM "AuditLog"
          WHERE "entityType" = ${params.entityType}
          ORDER BY "createdAt" DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
        total = await prisma.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM "AuditLog" WHERE "entityType" = ${params.entityType}
        `;
      } else if (params.performedById) {
        entries = await prisma.$queryRaw<any[]>`
          SELECT * FROM "AuditLog"
          WHERE "performedById" = ${params.performedById}
          ORDER BY "createdAt" DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
        total = await prisma.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM "AuditLog" WHERE "performedById" = ${params.performedById}
        `;
      } else {
        entries = await prisma.$queryRaw<any[]>`
          SELECT * FROM "AuditLog"
          ORDER BY "createdAt" DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
        total = await prisma.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM "AuditLog"
        `;
      }

      const totalCount = Array.isArray(total) && total[0] ? parseInt(total[0].count) : 0;

      return {
        ok: true,
        data: {
          entries,
          total: totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[AUDIT RECENT ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch recent activity.' };
    }
  },

  /**
   * Get audit statistics.
   */
  async getStats(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [byEntity, byAction, recentCount] = await Promise.all([
        prisma.$queryRaw<any[]>`
          SELECT "entityType", COUNT(*) as count FROM "AuditLog" GROUP BY "entityType" ORDER BY count DESC
        `,
        prisma.$queryRaw<any[]>`
          SELECT action, COUNT(*) as count FROM "AuditLog" GROUP BY action ORDER BY count DESC LIMIT 20
        `,
        prisma.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM "AuditLog" WHERE "createdAt" > NOW() - INTERVAL '24 hours'
        `,
      ]);

      return {
        ok: true,
        data: {
          byEntity,
          byAction,
          last24Hours: Array.isArray(recentCount) && recentCount[0] ? parseInt(recentCount[0].count) : 0,
        },
      };
    } catch (error: any) {
      console.error('[AUDIT STATS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch audit stats.' };
    }
  },
};