/** Vehicle-related constants */

export const VEHICLE_TYPES = ['suv', 'sedan', 'electric', 'hybrid', 'hatchback'] as const;

export const AVAILABILITY_LABELS: Record<string, string> = {
  available:     'In Stock',
  'coming-soon': 'Coming Soon',
  'pre-order':   'Pre-Order',
  limited:       'Limited Stock',
  'out-of-stock':'Out of Stock',
  active:        'Available',
  featured:      'Featured',
  new:           'New',
  popular:       'Popular',
  electric:      'Electric',
};

export const AVAILABILITY_COLORS: Record<string, string> = {
  available:     'bg-green-500',
  'coming-soon': 'bg-yellow-500',
  'pre-order':   'bg-blue-500',
  limited:       'bg-orange-500',
  'out-of-stock':'bg-red-500',
  active:        'bg-green-500',
  featured:      'bg-gold',
  new:           'bg-blue-500',
  popular:       'bg-orange-500',
  electric:      'bg-emerald-500',
};

export const MAX_COMPARE_VEHICLES = 3;
