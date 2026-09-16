'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

interface PermissionGroup {
  label: string;
  keys: { key: string; label: string }[];
}

interface MatrixData {
  permissionGroups: PermissionGroup[];
  effective: Record<string, Record<string, boolean>>;
}

// Shown next to the role <select> on the user create/edit forms so an admin
// sees what a role grants before saving, without leaving the page — the
// full editable matrix lives at /admin/users/roles. Pulls both the group
// definitions *and* the effective (default + any admin-applied override)
// permissions from that same matrix endpoint, rather than the separate,
// broader PERMISSION_GROUPS/ROLE_PERMISSIONS in lib/auth — those cover
// several keys (canManageOrders, canManageCustomers, canManageParts, …)
// the backend never actually enforces, so cross-checking against them
// silently drifted from what a role can really do. Only non-"canView*"
// keys count as "can" here, so a role that can merely view a group (e.g.
// Sales viewing vehicles) isn't shown as if it could manage it.
export default function RolePermissionPreview({ role }: { role: string }) {
  const [data, setData] = useState<MatrixData | null>(null);

  useEffect(() => {
    fetch('/api/admin/role-permissions')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;
  const permissions = data.effective[role];
  if (!permissions) return null;

  const allowed = data.permissionGroups
    .filter((group) => group.keys.some(({ key }) => !key.startsWith('canView') && permissions[key]))
    .map((group) => group.label);

  return (
    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 text-xs text-blue-900 dark:text-blue-200">
      <div className="flex items-center gap-1.5 font-semibold mb-1">
        <Info className="w-3.5 h-3.5" />
        This role can manage:
      </div>
      {allowed.length > 0 ? (
        <p className="leading-relaxed">{allowed.join(', ')}</p>
      ) : (
        <p className="text-blue-700 dark:text-blue-300">No management permissions — view-only or none.</p>
      )}
    </div>
  );
}
