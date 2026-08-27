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
    const dealer = await prisma.dealer.findFirst({
      where: {
        OR: [
          { id: preferredDealer },
          { name: { equals: preferredDealer, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    if (dealer) {
      const branchReps = allReps.filter((rep) => rep.dealerId === dealer.id);
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
