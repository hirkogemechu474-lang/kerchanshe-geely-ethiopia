export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Full access to all admin features' },
  { value: 'manager', label: 'Manager', description: 'Access to most admin features' },
  { value: 'sales', label: 'Sales', description: 'Access to sales and customer features' },
  { value: 'service', label: 'Service', description: 'Access to workshop and service features' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to admin dashboard' },
];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full administrative access',
  manager: 'Management-level access',
  sales: 'Sales team access',
  service: 'Service workshop access',
  viewer: 'Read-only access',
};
