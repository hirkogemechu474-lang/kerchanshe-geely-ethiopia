'use client';

import { ROLE_PERMISSIONS, AdminRole } from '@/lib/auth/types';
import { PERMISSION_GROUPS } from '@/lib/auth/permissionGroups';
import { Info } from 'lucide-react';

// Shown next to the role <select> on the user create/edit forms so an admin
// sees what a role grants before saving, without leaving the page — the
// full matrix lives at /admin/users/roles.
export default function RolePermissionPreview({ role }: { role: string }) {
  const permissions = ROLE_PERMISSIONS[role as AdminRole];
  if (!permissions) return null;

  const allowed = PERMISSION_GROUPS.flatMap((group) =>
    group.keys.filter(({ key }) => permissions[key]).map(({ label }) => label)
  );

  return (
    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-900">
      <div className="flex items-center gap-1.5 font-semibold mb-1">
        <Info className="w-3.5 h-3.5" />
        This role can:
      </div>
      {allowed.length > 0 ? (
        <p className="leading-relaxed">{allowed.join(', ')}</p>
      ) : (
        <p className="text-blue-700">No admin-panel permissions.</p>
      )}
    </div>
  );
}
