'use client';

import { useEffect, useState } from 'react';
import { ROLE_PERMISSIONS, AdminRole, type AdminPermissions } from '@/lib/auth/types';
import { PERMISSION_GROUPS } from '@/lib/auth/permissionGroups';
import { Info } from 'lucide-react';

// Shown next to the role <select> on the user create/edit forms so an admin
// sees what a role grants before saving, without leaving the page — the
// full editable matrix lives at /admin/users/roles. Fetches the *effective*
// (default + any admin-applied override merged) permissions from there so
// this preview can't drift from what the role actually grants; falls back to
// the hardcoded defaults if that request fails or hasn't resolved yet.
export default function RolePermissionPreview({ role }: { role: string }) {
  const [effective, setEffective] = useState<Record<string, AdminPermissions> | null>(null);

  useEffect(() => {
    fetch('/api/admin/role-permissions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setEffective(data.effective))
      .catch(() => {});
  }, []);

  const permissions = effective?.[role] ?? ROLE_PERMISSIONS[role as AdminRole];
  if (!permissions) return null;

  const allowed = Object.values(PERMISSION_GROUPS)
    .filter((group) => group.permissions.some((key) => permissions[key as keyof AdminPermissions]))
    .map((group) => group.label);

  return (
    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 text-xs text-blue-900 dark:text-blue-200">
      <div className="flex items-center gap-1.5 font-semibold mb-1">
        <Info className="w-3.5 h-3.5" />
        This role can:
      </div>
      {allowed.length > 0 ? (
        <p className="leading-relaxed">{allowed.join(', ')}</p>
      ) : (
        <p className="text-blue-700 dark:text-blue-300">No admin-panel permissions.</p>
      )}
    </div>
  );
}
