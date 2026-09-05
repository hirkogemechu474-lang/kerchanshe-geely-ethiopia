import { serverApiClient } from './serverApiClient';

export interface AssignmentRules {
  lowestWorkload: boolean;
  availability: boolean;
  workingHours: boolean;
  specialization: boolean;
  branch: boolean;
  managersOnly: boolean;
}

export async function listSalesReps(): Promise<{ id: string; name: string }[]> {
  try {
    const client = await serverApiClient();
    const { data } = await client.get('/admin/users', { params: { role: 'sales', pageSize: 100 } });
    return (data.items || [])
      .filter((user: { isActive?: boolean }) => user.isActive !== false)
      .map((user: { id: string; name: string }) => ({ id: user.id, name: user.name }));
  } catch {
    return [];
  }
}
