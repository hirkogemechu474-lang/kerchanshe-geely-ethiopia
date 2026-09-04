import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

export const repeatPurchaseService = {
  /**
   * Create an upgrade opportunity for a customer.
   */
  async createOpportunity(data: {
    customerId: string;
    vehicleId?: string;
    opportunityType: string; // TRADE_IN | UPGRADE | FAMILY_ADDITION | FLEET
    targetModel?: string;
    estimatedBudget?: number;
    source: string; // SERVICE_VISIT | FOLLOW_UP | MARKETING | SELF_REFERRAL
    assignedTo?: string;
    notes?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) return { ok: false, error: 'Customer not found.' };

      const oppCount = await prisma.upgradeOpportunity.count();
      const oppNo = `UPG-${String(oppCount + 1).padStart(5, '0')}`;

      const opportunity = await prisma.upgradeOpportunity.create({
        data: {
          opportunityNo: oppNo,
          customerId: data.customerId,
          vehicleId: data.vehicleId || null,
          opportunityType: data.opportunityType,
          targetModel: data.targetModel || null,
          estimatedBudget: data.estimatedBudget || null,
          source: data.source,
          status: 'IDENTIFIED',
          assignedTo: data.assignedTo || null,
          notes: data.notes || null,
        },
      });

      // Notify assigned sales rep
      if (data.assignedTo) {
        const agent = await prisma.user.findUnique({ where: { id: data.assignedTo }, select: { email: true, name: true } });
        if (agent?.email) {
          await dispatchNotification({
            type: 'upgrade_opportunity',
            to: [agent.email],
            subject: `New Upgrade Opportunity: ${customer.fullName}`,
            data: {
              opportunityNo: oppNo,
              customerName: customer.fullName,
              opportunityType: data.opportunityType,
              targetModel: data.targetModel,
            },
          });
        }
      }

      return { ok: true, data: opportunity };
    } catch (error: any) {
      console.error('[UPGRADE OPPORTUNITY CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create upgrade opportunity.' };
    }
  },

  /**
   * Auto-detect upgrade opportunities from service data.
   * Looks for vehicles over 3 years old, high mileage, or frequent service visits.
   */
  async detectOpportunities(): Promise<{ ok: boolean; createdCount: number }> {
    try {
      const currentYear = new Date().getFullYear();

      // Find vehicles that might be upgrade candidates
      const vehicles = await prisma.customerVehicle.findMany({
        where: {
          OR: [
            { year: { lte: currentYear - 3 } },
            { mileageLastKnown: { gte: 80000 } },
          ],
        },
        include: { customer: true },
      });

      let createdCount = 0;

      for (const vehicle of vehicles) {
        // Check if an opportunity already exists for this vehicle
        const existing = await prisma.upgradeOpportunity.findFirst({
          where: { vehicleId: vehicle.id, status: { notIn: ['WON', 'LOST', 'EXPIRED'] } },
        });

        if (existing) continue;

        const reason = vehicle.mileageLastKnown && vehicle.mileageLastKnown >= 80000 ? 'high-mileage' : 'age';

        await this.createOpportunity({
          customerId: vehicle.customerId,
          vehicleId: vehicle.id,
          opportunityType: 'TRADE_IN',
          source: 'SERVICE_VISIT',
          notes: `Auto-detected: Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.year}) - ${reason}`,
        });
        createdCount++;
      }

      return { ok: true, createdCount };
    } catch (error: any) {
      console.error('[DETECT OPPORTUNITIES ERROR]', error.message);
      return { ok: false, createdCount: 0 };
    }
  },

  /**
   * Update opportunity status.
   */
  async updateStatus(
    opportunityId: string,
    status: string, // IDENTIFIED | CONTACTED | QUALIFIED | PROPOSAL | NEGOTIATION | WON | LOST | EXPIRED
    changedById: string,
    notes?: string
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await prisma.upgradeOpportunity.findUnique({ where: { id: opportunityId } });
      if (!existing) return { ok: false, error: 'Opportunity not found.' };

      const updated = await prisma.upgradeOpportunity.update({
        where: { id: opportunityId },
        data: {
          status: status as any,
          ...(status === 'WON' && { wonAt: new Date(), wonById: changedById }),
          ...(status === 'LOST' && { lostAt: new Date(), lostReason: notes }),
        },
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[UPDATE OPPORTUNITY STATUS ERROR]', error.message);
      return { ok: false, error: 'Failed to update opportunity status.' };
    }
  },

  /**
   * Get upgrade opportunities for a customer.
   */
  async getByCustomer(customerId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const opportunities = await prisma.upgradeOpportunity.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });
      return { ok: true, data: opportunities };
    } catch (error: any) {
      console.error('[GET OPPORTUNITIES BY CUSTOMER ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch opportunities.' };
    }
  },

  /**
   * List all upgrade opportunities with filters.
   */
  async list(params: {
    status?: string;
    opportunityType?: string;
    assignedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (params.status) where.status = params.status;
      if (params.opportunityType) where.opportunityType = params.opportunityType;
      if (params.assignedTo) where.assignedTo = params.assignedTo;

      const [opportunities, total] = await Promise.all([
        prisma.upgradeOpportunity.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.upgradeOpportunity.count({ where }),
      ]);

      return {
        ok: true,
        data: {
          opportunities,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[LIST OPPORTUNITIES ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch opportunities.' };
    }
  },

  /**
   * Get upgrade pipeline dashboard.
   */
  async getPipelineDashboard(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const byStatus = await prisma.upgradeOpportunity.groupBy({
        by: ['status'],
        _count: true,
      });

      const byType = await prisma.upgradeOpportunity.groupBy({
        by: ['opportunityType'],
        _count: true,
      });

      const bySource = await prisma.upgradeOpportunity.groupBy({
        by: ['source'],
        _count: true,
      });

      const totalValue = await prisma.upgradeOpportunity.aggregate({
        where: { status: { notIn: ['WON', 'LOST', 'EXPIRED'] } },
        _sum: { estimatedBudget: true },
        _count: true,
      });

      const wonCount = await prisma.upgradeOpportunity.count({ where: { status: 'WON' } });
      const totalActive = await prisma.upgradeOpportunity.count({ where: { status: { notIn: ['WON', 'LOST', 'EXPIRED'] } } });
      const conversionRate = totalActive > 0 ? Math.round((wonCount / (wonCount + totalActive)) * 100) : 0;

      return {
        ok: true,
        data: {
          byStatus,
          byType,
          bySource,
          totalPipelineValue: totalValue._sum.estimatedBudget || 0,
          totalActiveOpportunities: totalActive,
          wonCount,
          conversionRate,
        },
      };
    } catch (error: any) {
      console.error('[PIPELINE DASHBOARD ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch pipeline dashboard.' };
    }
  },
};