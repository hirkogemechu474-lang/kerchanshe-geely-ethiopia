import { userRepository, quotationRepository, salesOrderRepository } from '../../repositories';
import { prisma } from '../../config/database';
import { settingRepository } from '../../repositories/setting.repository';

interface AssignmentScore {
  userId: string;
  score: number; // higher = better match
  reason?: string;
}

export interface AssignmentFactors {
  workloadWeight?: number;
  availabilityWeight?: number;
  specializationWeight?: number;
  territoryWeight?: number;
}

interface AssignmentRules {
  lowestWorkload: boolean;
  availability: boolean;
  workingHours: boolean;
  specialization: boolean;
  branch: boolean;
  managersOnly: boolean;
}

const DEFAULT_FACTORS: AssignmentFactors = {
  workloadWeight: 0.4,
  availabilityWeight: 0.3,
  specializationWeight: 0.3,
};

async function getAssignmentRules(): Promise<AssignmentRules> {
  const defaultRules: AssignmentRules = {
    lowestWorkload: true,
    availability: false,
    workingHours: false,
    specialization: false,
    branch: true,
    managersOnly: false,
  };
  try {
    const setting = await settingRepository.findByKey('assignment_rules');
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return { ...defaultRules, ...parsed };
    }
  } catch {
    // fall through to defaults
  }
  return defaultRules;
}

export async function assignSalesRep(params: {
  targetType: 'quotation' | 'order';
  targetId: string;
  salesRepName?: string;
  salesRepId?: string;
  autoAssign?: boolean;
  factors?: AssignmentFactors;
  /** Force manager-tier assignment (sales_manager/general_manager/admin)
   * regardless of the admin-configured `managersOnly` rule — used by
   * escalation, which must always hand off to a manager, not whatever the
   * default sales-rep auto-assign rule is currently set to. */
  forceManagerOnly?: boolean;
}): Promise<{ ok: boolean; data?: any; error?: string; assignedRep?: any }> {
  try {
    let resolvedRepId = params.salesRepId;

    if (!resolvedRepId && params.salesRepName) {
      const rep = await userRepository.findActiveSalesRepByName(params.salesRepName);
      if (!rep) return { ok: false, error: `Sales representative "${params.salesRepName}" not found.` };
      resolvedRepId = rep.id;
    }

    if (params.autoAssign || (!resolvedRepId && params.targetType === 'quotation')) {
      // Automatic assignment based on workload, availability, skills, territory
      const autoResult = await autoAssignBestRep(
        params.targetType,
        params.targetId,
        params.factors,
        params.forceManagerOnly
      );
      if (!autoResult.ok) return autoResult;

      resolvedRepId = autoResult.data!.userId;

      // Persist the auto-assignment when there's a real target to persist it
      // to. quotationService.create() intentionally calls this with
      // targetId: '' before the row exists yet (and writes the result
      // itself once it does) — without this guard, every other caller
      // (e.g. the POST /:id/assign-rep route) computed a "best rep" that
      // was never actually saved anywhere.
      if (params.targetId) {
        if (params.targetType === 'quotation') {
          await quotationRepository.update(params.targetId, { assignedTo: resolvedRepId });
        } else {
          await salesOrderRepository.update(params.targetId, { salesAgentId: resolvedRepId });
        }

        // Write assignment history
        try {
          if (params.targetType === 'quotation') {
            await prisma.quotationAssignmentHistory.create({
              data: {
                quotationId: params.targetId,
                assignedTo: resolvedRepId,
                assignedById: 'system',
                assignmentReason: autoResult.data!.reason || 'auto-assign',
              },
            });
          }
        } catch {
          // Audit write failure should not block the flow
        }
      }

      return {
        ok: true,
        data: autoResult.data,
        assignedRep: autoResult.data,
      };
    }

    if (!resolvedRepId) {
      return { ok: false, error: 'No sales representative specified.' };
    }

    const rep = await userRepository.findByIdSlim(resolvedRepId);
    if (!rep) return { ok: false, error: 'Sales representative not found.' };

    if (params.targetType === 'quotation') {
      const quotation = await quotationRepository.findById(params.targetId);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };

      const updated = await quotationRepository.update(params.targetId, {
        assignedTo: resolvedRepId,
      });

      // Write assignment history for manual assignment
      try {
        await prisma.quotationAssignmentHistory.create({
          data: {
            quotationId: params.targetId,
            assignedTo: resolvedRepId,
            assignedById: 'admin',
            assignmentReason: 'manual',
          },
        });
      } catch {
        // Audit write failure should not block the flow
      }

      return { ok: true, data: updated };
    } else {
      const order = await salesOrderRepository.findById(params.targetId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const updated = await salesOrderRepository.update(params.targetId, {
        salesAgentId: resolvedRepId,
      });

      return { ok: true, data: updated };
    }
  } catch (error: any) {
    console.error('[ASSIGN SALES REP ERROR]', error.message);
    return { ok: false, error: 'Failed to assign sales representative.' };
  }
}

interface BestRepResult {
  userId: string;
  score: number;
  reason: string;
}

/**
 * Auto-assign the best sales rep based on:
 * - Workload (fewest active quotations/orders)
 * - Availability (isAvailableForLeads, lead hours)
 * - Brand specializations match
 * - Territory (dealerId match)
 */
async function autoAssignBestRep(
  targetType: 'quotation' | 'order',
  targetId: string,
  factors?: AssignmentFactors,
  forceManagerOnly?: boolean
): Promise<{ ok: boolean; data?: BestRepResult; error?: string }> {
  try {
    // Load assignment rules from admin settings
    const rules = await getAssignmentRules();

    const effectiveFactors = {
      workloadWeight: factors?.workloadWeight ?? DEFAULT_FACTORS.workloadWeight ?? 0,
      availabilityWeight: factors?.availabilityWeight ?? DEFAULT_FACTORS.availabilityWeight ?? 0,
      specializationWeight: factors?.specializationWeight ?? DEFAULT_FACTORS.specializationWeight ?? 0,
    };

    // Get all active sales reps — if managersOnly (or an explicit
    // forceManagerOnly caller, e.g. escalation), filter to manager-tier
    // roles instead (same set treated as "manager" everywhere else, e.g.
    // userRepository.findManagerEmails()).
    const salesRoles = ['sales', 'sales_representative', 'sales_agent'];
    const managerRoles = ['sales_manager', 'general_manager', 'admin'];
    const allReps = await prisma.user.findMany({
      where: {
        isActive: true,
        role: forceManagerOnly || rules.managersOnly ? { in: managerRoles } : { in: salesRoles },
      },
      select: {
        id: true,
        name: true,
        lastLogin: true,
        isAvailableForLeads: true,
        leadHoursStart: true,
        leadHoursEnd: true,
        brandSpecializations: { select: { brandId: true } },
      },
    });

    console.log('[ASSIGN] Rules:', rules, 'Found reps:', allReps.length, allReps.map(r => r.name));

    if (allReps.length === 0) {
      return {
        ok: false,
        error: forceManagerOnly || rules.managersOnly
          ? 'No active managers found to assign to.'
          : 'No active sales representatives found.',
      };
    }

    // Get target data to determine vehicle model/brand for specialization matching
    let targetBrandId: string | undefined;
    if (targetId) {
      if (targetType === 'quotation') {
        const quotation = await quotationRepository.findById(targetId);
        if (!quotation) return { ok: false, error: 'Quotation not found.' };
        if (quotation.vehicleModel) {
          const vehicle = await findVehicleBrandByModel(quotation.vehicleModel);
          if (vehicle?.brandId) targetBrandId = vehicle.brandId;
        }
      } else {
        const order = await salesOrderRepository.findById(targetId);
        if (!order) return { ok: false, error: 'Order not found.' };
        if (order.vehicleModel) {
          const vehicle = await findVehicleBrandByModel(order.vehicleModel);
          if (vehicle?.brandId) targetBrandId = vehicle.brandId;
        }
      }
    }

    // Score each rep
    const scores: BestRepResult[] = [];
    const lastLoginById = new Map(allReps.map((r) => [r.id, r.lastLogin]));

    for (const rep of allReps) {
      let score = 0;
      let reasons: string[] = [];

      // Filter: if availability rule is on, skip unavailable reps
      if (rules.availability && rep.isAvailableForLeads === false) continue;

      // Filter: if workingHours rule is on, skip reps outside their hours
      if (rules.workingHours && rep.leadHoursStart !== null && rep.leadHoursEnd !== null) {
        const hour = new Date().getHours();
        if (hour < rep.leadHoursStart || hour > rep.leadHoursEnd) continue;
      }

      // 1. Workload score (0-40%): Fewest active quotations + orders
      if (rules.lowestWorkload) {
        const workloadScore = await calculateWorkloadScore(rep.id, targetId);
        score += workloadScore * effectiveFactors.workloadWeight;
        if (workloadScore > 0) reasons.push(`Low workload (${workloadScore.toFixed(1)}/40)`);
      }

      // 2. Availability score (0-30%): isAvailableForLeads and lead hours
      const availabilityScore = calculateAvailabilityScore(rep, rules);
      score += availabilityScore * effectiveFactors.availabilityWeight;
      if (availabilityScore > 0) reasons.push(`Available${rep.leadHoursStart !== null ? ` (${rep.leadHoursStart}-${rep.leadHoursEnd}h)` : ''}`);

      // 3. Specialization score (0-30%): Brand match
      if (rules.specialization) {
        const specializationScore = calculateSpecializationScore(rep, targetBrandId);
        score += specializationScore * effectiveFactors.specializationWeight;
        if (specializationScore > 0) reasons.push(`Specialization match`);
      }

      if (score > 0) {
        scores.push({
          userId: rep.id,
          score,
          reason: reasons.join(', '),
        });
      }
    }

    if (scores.length === 0) {
      if (allReps.length === 0) {
        return { ok: false, error: 'No active sales representatives found.' };
      }
      // Fallback: every rep scored 0 (e.g. everyone marked unavailable) — still
      // pick the least-loaded rep by actual workload rather than an unrelated
      // signal like login recency.
      const fallbackScored = await Promise.all(
        allReps.map(async (rep) => ({ rep, workload: await calculateWorkloadScore(rep.id, targetId) }))
      );
      fallbackScored.sort((a, b) => b.workload - a.workload);
      const fallbackRep = fallbackScored[0].rep;
      console.log('[ASSIGN] All scores 0, fallback to least-loaded:', fallbackRep.name);
      return { ok: true, data: { userId: fallbackRep.id, score: 0, reason: 'Fallback assignment (least-loaded)' } };
    }

    // Sort by score descending, then by lastLogin ascending (prefer recently active)
    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aLogin = lastLoginById.get(a.userId)?.getTime() ?? 0;
      const bLogin = lastLoginById.get(b.userId)?.getTime() ?? 0;
      return aLogin - bLogin;
    });

    const best = scores[0];
    console.log('[ASSIGN] Best rep:', best.userId, 'score:', best.score, 'reason:', best.reason);
    return { ok: true, data: best };
  } catch (error: any) {
    console.error('[AUTO ASSIGN BEST REP ERROR]', error.message);
    return { ok: false, error: 'Failed to determine best sales representative.' };
  }
}

async function calculateWorkloadScore(repId: string, targetId: string): Promise<number> {
  const [openQuotations, openOrders] = await Promise.all([
    prisma.quotation.count({
      where: {
        assignedTo: repId,
        id: { not: targetId },
        status: { notIn: ['converted', 'closed'] },
      },
    }),
    prisma.salesOrder.count({
      where: {
        salesAgentId: repId,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    }),
  ]);

  // Forty points is the maximum workload contribution. Each active deal
  // reduces the score, so the least-loaded available agent wins the tie.
  return Math.max(0, 40 - (openQuotations + openOrders) * 5);
}

function calculateAvailabilityScore(rep: any, rules?: AssignmentRules): number {
  if (rep.isAvailableForLeads === false) return 0;

  let score = 30; // fully available by default

  // If workingHours rule is enabled, reduce score for reps outside their hours
  // (already filtered above, but this applies to the weighted scoring)
  if (rules?.workingHours && rep.leadHoursStart !== null && rep.leadHoursEnd !== null) {
    const hour = new Date().getHours();
    if (hour < rep.leadHoursStart || hour > rep.leadHoursEnd) {
      score = 15; // available but outside preferred hours — half credit
    }
  }

  return score;
}

function calculateSpecializationScore(rep: any, targetBrandId?: string): number {
  if (!targetBrandId) return 30; // no brand constraint = full score

  // Check brand specializations
  const specializations = rep.brandSpecializations || [];
  const matchingBrand = specializations.find((sb: any) => sb.brandId === targetBrandId);

  if (matchingBrand) return 30; // perfect match
  if (specializations.length > 0) return 15; // has some specializations but not this one
  return 0; // no specializations defined
}

// Vehicle.name is the free-text label Quotation.vehicleModel/SalesOrder.vehicleModel
// store (there's no FK) — best-effort match by name, same convention
// admin/components/admin/sales/QuotationPdfPanel.tsx documents for resolving
// vehicle colors from a quotation's vehicleModel.
async function findVehicleBrandByModel(model: string): Promise<{ brandId: string | null } | null> {
  return prisma.vehicle.findFirst({ where: { name: model }, select: { brandId: true } });
}
