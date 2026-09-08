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
const ASSIGNABLE_ROLES = ['sales', 'sales_manager', 'general_manager', 'admin'];

export async function listSalesReps(): Promise<{ id: string; name: string }[]> {
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
    const reps: { id: string; name: string }[] = [];
    for (const { data } of responses) {
      for (const user of (data.items || []) as { id: string; name: string; isActive?: boolean }[]) {
        if (user.isActive === false || seen.has(user.id)) continue;
        seen.add(user.id);
        reps.push({ id: user.id, name: user.name });
      }
    }
    return reps.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
