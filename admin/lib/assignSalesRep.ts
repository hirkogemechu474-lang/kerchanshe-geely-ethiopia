import { OrderStatus } from '@prisma/client';
import { prisma } from './prisma';

// Roles considered front-line sales reps eligible for automatic lead
// assignment — matches the role strings in admin/lib/auth/types.ts. Mirrors
// web/lib/assignSalesRep.ts (same logic, admin's own Prisma client) so
// leads created from either app land on the same workload-balanced rep.
const ASSIGNABLE_ROLES = ['sales', 'sales_representative', 'sales_manager'];

// Quotation/SalesOrder statuses that count as "closed out" and therefore
// shouldn't count toward a rep's current workload.
const CLOSED_QUOTATION_STATUSES = ['converted', 'closed'];
const CLOSED_ORDER_STATUSES: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

// Resolves a free-text/id `preferredDealer` value (callers pass either a
// Dealer id or a free-text location/dealer name depending on source) to a
// Dealer id, or null if it can't be resolved. Shared by nextSalesRep and
// resolveManagersForLead so both branch-scope the same way.
async function resolveDealerId(preferredDealer: string): Promise<string | null> {
  const dealer = await prisma.dealer.findFirst({
    where: {
      OR: [
        { id: preferredDealer },
        { name: { equals: preferredDealer, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });
  return dealer?.id ?? null;
}

// Workload-balanced assignment across active sales-role users: whichever
// rep currently has the fewest open quotations + open sales orders gets
// the next lead, instead of blind round-robin.
export async function nextSalesRep(
  preferredDealer?: string | null
): Promise<{ id: string; name: string } | null> {
  const allReps = await prisma.user.findMany({
    where: { role: { in: ASSIGNABLE_ROLES }, isActive: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true, dealerId: true },
  });
  if (allReps.length === 0) return null;

  let reps = allReps;
  if (preferredDealer) {
    const dealerId = await resolveDealerId(preferredDealer);
    if (dealerId) {
      const branchReps = allReps.filter((rep) => rep.dealerId === dealerId);
      if (branchReps.length > 0) reps = branchReps;
    }
  }

  const counts = await Promise.all(
    reps.map(async (rep) => {
      const [openQuotations, openOrders] = await Promise.all([
        prisma.quotation.count({
          where: { assignedTo: rep.name, status: { notIn: CLOSED_QUOTATION_STATUSES } },
        }),
        prisma.salesOrder.count({
          where: { salesAgentId: rep.name, status: { notIn: CLOSED_ORDER_STATUSES } },
        }),
      ]);
      return { rep, count: openQuotations + openOrders };
    })
  );

  counts.sort((a, b) => a.count - b.count);
  return { id: counts[0].rep.id, name: counts[0].rep.name };
}

// All active sales-role users, for a manager's manual reassignment dropdown.
export async function listSalesReps(): Promise<{ id: string; name: string }[]> {
  return prisma.user.findMany({
    where: { role: { in: ASSIGNABLE_ROLES }, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

// Sales managers to notify about a new lead. Scoped to preferredDealer's
// branch when it resolves to a dealer with at least one active manager
// there; otherwise (no dealer, unresolvable, or no manager at that branch)
// falls back to every active sales_manager — same fallback shape as
// nextSalesRep's own branch-scoping.
export async function resolveManagersForLead(
  preferredDealer?: string | null
): Promise<{ id: string; name: string; email: string }[]> {
  const allManagers = await prisma.user.findMany({
    where: { role: 'sales_manager', isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, dealerId: true },
  });
  if (allManagers.length === 0) return [];

  if (preferredDealer) {
    const dealerId = await resolveDealerId(preferredDealer);
    if (dealerId) {
      const branchManagers = allManagers.filter((m) => m.dealerId === dealerId);
      if (branchManagers.length > 0) return branchManagers;
    }
  }

  return allManagers;
}
