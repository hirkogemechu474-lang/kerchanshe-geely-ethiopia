export interface AssignmentRules {
  lowestWorkload: boolean;
  availability: boolean;
  workingHours: boolean;
  specialization: boolean;
  branch: boolean;
  managersOnly: boolean;
}

export async function listSalesReps(): Promise<{ id: string; name: string }[]> {
  return [];
}
