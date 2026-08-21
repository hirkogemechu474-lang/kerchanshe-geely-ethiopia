import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import RolesPermissionsManager from '@/components/admin/users/RolesPermissionsManager';

// BRD §17.2 Role Permission Matrix, made editable: an admin can toggle any
// permission for any staff role (super_admin excepted — see
// admin/lib/auth/rolePermissions.ts) and find a user to assign a role,
// without leaving this page. Changes take effect on the affected users' next
// request — see the `session` callback in admin/lib/auth/config.ts.

export default async function RolesAndPermissionsPage() {
  await requirePermission('canManageUsers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="What each role can do (BRD §17.2) — click a cell to grant or revoke it, or find a user below to assign their role."
      />
      <RolesPermissionsManager />
    </div>
  );
}
