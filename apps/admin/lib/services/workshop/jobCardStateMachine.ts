export const JOB_CARD_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const JOB_CARD_STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  open: 'yellow',
  assigned: 'blue',
  in_progress: 'blue',
  on_hold: 'yellow',
  completed: 'green',
  cancelled: 'red',
};

export function getAllowedTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    draft: ['open', 'cancelled'],
    open: ['assigned', 'cancelled'],
    assigned: ['in_progress', 'open'],
    in_progress: ['completed', 'on_hold'],
    on_hold: ['in_progress', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return transitions[currentStatus] || [];
}
