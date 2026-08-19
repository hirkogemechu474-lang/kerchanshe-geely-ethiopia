/** Status badge constants used across admin tables */

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  draft:     'Draft',
  published: 'Published',
  archived:  'Archived',
};

export const VEHICLE_STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived:  'bg-red-100 text-red-700',
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
