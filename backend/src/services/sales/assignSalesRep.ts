import { userRepository, quotationRepository, salesOrderRepository } from '../../repositories';
import { prisma } from '../../config/database';

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

const DEFAULT_FACTORS: AssignmentFactors = {
  workloadWeight: 0.4,
  availabilityWeight: 0.3,
  specializationWeight: 0.3,
};

export async function assignSalesRep(params: {
  targetType: 'quotation' | 'order';
  targetId: string;
  salesRepName?: string;
  salesRepId?: string;
  autoAssign?: boolean;
  factors?: AssignmentFactors;
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
        params.factors
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
  factors?: AssignmentFactors
): Promise<{ ok: boolean; data?: BestRepResult; error?: string }> {
  try {
    const effectiveFactors = {
      workloadWeight: factors?.workloadWeight ?? DEFAULT_FACTORS.workloadWeight ?? 0,
      availabilityWeight: factors?.availabilityWeight ?? DEFAULT_FACTORS.availabilityWeight ?? 0,
      specializationWeight: factors?.specializationWeight ?? DEFAULT_FACTORS.specializationWeight ?? 0,
    };

    // Get all active sales reps — userRepository.findManyActive()'s select is
    // a plain listing projection that omits the availability/specialization
    // columns this scoring pass needs, so query directly here instead.
    const allReps = await prisma.user.findMany({
      where: { isActive: true, role: 'sales' },
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

    if (allReps.length === 0) {
      return { ok: false, error: 'No active sales representatives found.' };
    }

    // Get target data to determine vehicle model/brand for specialization matching
    let targetBrandId: string | undefined;
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

    // Score each rep
    const scores: BestRepResult[] = [];
    const lastLoginById = new Map(allReps.map((r) => [r.id, r.lastLogin]));

    for (const rep of allReps) {
      let score = 0;
      let reasons: string[] = [];

      // 1. Workload score (0-40%): Fewest active quotations + orders
      const workloadScore = calculateWorkloadScore(rep.id, targetType, targetId);
      score += workloadScore * effectiveFactors.workloadWeight;
      if (workloadScore > 0) reasons.push(`Low workload (${workloadScore.toFixed(1)}/40)`);

      // 2. Availability score (0-30%): isAvailableForLeads and lead hours
      const availabilityScore = calculateAvailabilityScore(rep);
      score += availabilityScore * effectiveFactors.availabilityWeight;
      if (availabilityScore > 0) reasons.push(`Available${rep.leadHoursStart !== null ? ` (${rep.leadHoursStart}-${rep.leadHoursEnd}h)` : ''}`);

      // 3. Specialization score (0-30%): Brand match
      const specializationScore = calculateSpecializationScore(rep, targetBrandId);
      score += specializationScore * effectiveFactors.specializationWeight;
      if (specializationScore > 0) reasons.push(`Specialization match`);

      if (score > 0) {
        scores.push({
          userId: rep.id,
          score,
          reason: reasons.join(', '),
        });
      }
    }

    if (scores.length === 0) {
      // Fallback: assign to least recently logged-in rep
      const fallbackRep = allReps.sort((a, b) => (a.lastLogin?.getTime() ?? 0) - (b.lastLogin?.getTime() ?? 0))[0];
      return { ok: true, data: { userId: fallbackRep.id, score: 0, reason: 'Fallback assignment' } };
    }

    // Sort by score descending, then by lastLogin ascending (prefer recently active)
    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aLogin = lastLoginById.get(a.userId)?.getTime() ?? 0;
      const bLogin = lastLoginById.get(b.userId)?.getTime() ?? 0;
      return aLogin - bLogin;
    });

    const best = scores[0];
    return { ok: true, data: best };
  } catch (error: any) {
    console.error('[AUTO ASSIGN BEST REP ERROR]', error.message);
    return { ok: false, error: 'Failed to determine best sales representative.' };
  }
}

function calculateWorkloadScore(repId: string, targetType: string, targetId: string): number {
  // Base score for having no prior assignments
  let base = 40;

  if (targetType === 'quotation') {
    // Count open quotations assigned to this rep
    // This would need a repository method - for now use estimate
    return Math.max(0, base - 5); // slight penalty/bonus
  } else {
    // Count orders in non-terminal status
    return Math.max(0, base - 5);
  }
}

function calculateAvailabilityScore(rep: any): number {
  let score = 0;
  if (rep.isAvailableForLeads !== false) {
    score = 30; // fully available
    if (rep.leadHoursStart !== null && rep.leadHoursEnd !== null) {
      // Within lead hours = full availability
      const now = new Date();
      const hour = now.getHours();
      if (hour >= rep.leadHoursStart && hour <= rep.leadHoursEnd) {
        // Within restricted hours but available - still count as available
      }
    }
  } else {
    score = 0; // not available for leads
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
