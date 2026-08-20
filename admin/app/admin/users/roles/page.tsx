import { Fragment } from 'react';
import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import { ADMIN_ROLES, ROLE_PERMISSIONS } from '@/lib/auth/types';
import { PERMISSION_GROUPS, roleLabel } from '@/lib/auth/permissionGroups';
import { Check, X } from 'lucide-react';

// BRD §17.2 Role Permission Matrix, made visible in the UI: permissions are
// still fixed role presets (no per-user overrides — see docs/ADMIN-IA-BACKLOG.md
// for that scope decision), this just surfaces the existing ROLE_PERMISSIONS
// map from admin/lib/auth/types.ts so admins can see what a role can do.

export default async function RolesAndPermissionsPage() {
  await requirePermission('canManageUsers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="What each role can do (BRD §17.2). Permissions are assigned by role — pick a role for a user on their profile page."
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">Permission</th>
              {ADMIN_ROLES.map((role) => (
                <th key={role} className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {roleLabel(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.label}>
                <tr className="bg-gray-50/70">
                  <td colSpan={ADMIN_ROLES.length + 1} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {group.label}
                  </td>
                </tr>
                {group.keys.map(({ key, label }) => (
                  <tr key={key} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2.5 text-gray-700 sticky left-0 bg-white">{label}</td>
                    {ADMIN_ROLES.map((role) => {
                      const allowed = ROLE_PERMISSIONS[role][key];
                      return (
                        <td key={role} className="text-center px-4 py-2.5">
                          {allowed ? (
                            <Check className="w-4 h-4 text-green-600 inline" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 inline" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
