import { serverApiClient } from './serverApiClient';

export interface AssignmentRules {
  lowestWorkload: boolean;
  availability: boolean;
  workingHours: boolean;
  specialization: boolean;
  branch: boolean;
  managersOnly: boolean;
}

// A lead should be assignable to a manager directly (not only delegated to
// a sales rep) — same manager-role set as backend userRepository.
// findManagerEmails(), so "who counts as a manager" stays in one place.
const ASSIGNABLE_ROLES = ['sales', 'sales_manager', 'general_manager', 'admin', 'sales_representative', 'super_admin'];

// Same "who counts as a manager" set as backend assignSalesRep.ts's
// managerRoles / userRepository.findManagerEmails(), plus super_admin (also
// assignable — see ASSIGNABLE_ROLES above). Used by the Quotation detail page
// to decide whether the assignee's name is allowed to default the printed
// "Sales executive" field: a manager's name is fine to print automatically,
// a plain sales agent's is not.
export const MANAGER_ROLES = ['sales_manager', 'general_manager', 'admin', 'super_admin'];

export async function listSalesReps(): Promise<{ id: string; name: string; role: string }[]> {
  try {
    const client = await serverApiClient();
    // The backend's /admin/users route only filters by a single exact role
    // (no "in" support), so fetch each assignable role in parallel and merge.
    const responses = await Promise.all(
      ASSIGNABLE_ROLES.map((role) =>
        client.get('/admin/users', { params: { role, pageSize: 100 } }).catch(() => ({ data: { items: [] } }))
      )
    );
    const seen = new Set<string>();
    const reps: { id: string; name: string; role: string }[] = [];
    for (const { data } of responses) {
      for (const user of (data.items || []) as { id: string; name: string; role: string; isActive?: boolean }[]) {
        if (user.isActive === false || seen.has(user.id)) continue;
        seen.add(user.id);
        reps.push({ id: user.id, name: user.name, role: user.role });
      }
    }
    return reps.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
