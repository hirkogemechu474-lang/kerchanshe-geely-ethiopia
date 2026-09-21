import { serverApiClient } from './serverApiClient';

export interface AssignmentRules {
  lowestWorkload: boolean;
  availability: boolean;
  workingHours: boolean;
  specialization: boolean;
  branch: boolean;
  managersOnly: boolean;
}

// Same "who counts as a manager" set as backend assignSalesRep.ts's
// managerRoles / userRepository.findManagerEmails(), plus super_admin (also
// assignable — see backend/src/routes/sales-reps.routes.ts's
// ASSIGNABLE_ROLES). Used by the Quotation detail page to decide whether
// the assignee's name is allowed to default the printed "Sales executive"
// field: a manager's name is fine to print automatically, a plain sales
// agent's is not.
export const MANAGER_ROLES = ['sales_manager', 'general_manager', 'admin', 'super_admin'];

export async function listSalesReps(): Promise<{ id: string; name: string; role: string }[]> {
  try {
    const client = await serverApiClient();
    // GET /admin/sales-reps (backend/src/routes/sales-reps.routes.ts) — a
    // lightweight, canManageQuotations/canManageOrders-gated endpoint made
    // for exactly this. GET /admin/users requires canManageUsers, which
    // sales/sales_manager/manager callers of this function don't have, so
    // that call 403'd and this always returned an empty list for them
    // (silently — the dropdown just showed no reps to pick).
    const { data } = await client.get('/admin/sales-reps');
    const reps = (data.items || []) as { id: string; name: string; role: string }[];
    return reps.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
