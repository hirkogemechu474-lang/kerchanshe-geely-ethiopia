import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, Users, Shield, Activity, UserX } from 'lucide-react';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader, LinkButton, Card, StatTile, TableCard, THead, TBody, Tr, Th, Td, Badge, EmptyTableRow } from '@/components/admin/ui';

export default async function UsersPage() {
  await requirePermission('canManageUsers');

  const client = await serverApiClient();
  const res = await client.get('/admin/users', { params: { pageSize: 1000 } });
  const users = res.data.items;

  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.isActive).length;
  const inactiveUsers = users.filter((u: any) => !u.isActive).length;
  const uniqueRoles = [...new Set(users.map((u: any) => u.role))].length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage admin users and permissions"
        actions={
          <>
            <LinkButton href="/admin/users/roles" variant="secondary">
              <Shield className="w-4 h-4" />
              Roles &amp; Permissions
            </LinkButton>
            <LinkButton href="/admin/users/new">
              <Plus className="w-5 h-5" />
              Add User
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatTile label="Total Users" value={totalUsers} icon={Users} />
        <StatTile label="Active Users" value={activeUsers} icon={Activity} />
        <StatTile label="Roles" value={uniqueRoles} icon={Shield} />
        <StatTile label="Inactive" value={inactiveUsers} icon={UserX} />
      </div>

      <TableCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <THead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Title</Th>
                <Th>Role</Th>
                <Th>Phone</Th>
                <Th>Signature</Th>
                <Th>Stamp</Th>
                <Th>Leads</Th>
                <Th>Lead Hours</Th>
                <Th>Brands</Th>
                <Th>Created</Th>
                <Th>Last Login</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {users.length === 0 ? (
                <EmptyTableRow colSpan={14} message="No users found" />
              ) : (
                users.map((user: any) => (
                  <Tr key={user.id}>
                    <Td className="font-medium text-gray-900">{user.name}</Td>
                    <Td className="text-gray-500">{user.email}</Td>
                    <Td className="text-gray-500">{user.title || '—'}</Td>
                    <Td>
                      <Badge tone="blue">
                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                      </Badge>
                    </Td>
                    <Td className="text-gray-500">—</Td>
                    <Td>
                      <Badge tone={user.signatureUrl ? 'green' : 'gray'}>
                        {user.signatureUrl ? 'Set' : 'Not set'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={user.stampUrl ? 'green' : 'gray'}>
                        {user.stampUrl ? 'Set' : 'Not set'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={user.isAvailableForLeads ? 'green' : 'red'}>
                        {user.isAvailableForLeads ? 'Available' : 'Unavailable'}
                      </Badge>
                    </Td>
                    <Td className="text-gray-500">
                      {user.leadHoursStart != null && user.leadHoursEnd != null
                        ? `${String(user.leadHoursStart).padStart(2, '0')}:00 – ${String(user.leadHoursEnd).padStart(2, '0')}:00`
                        : '—'}
                    </Td>
                    <Td className="text-gray-500">
                      {user.brandSpecializations?.length
                        ? `${user.brandSpecializations.length} brand(s)`
                        : 'All'}
                    </Td>
                    <Td className="text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </Td>
                    <Td className="text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </Td>
                    <Td>
                      <Badge tone={user.isActive ? 'green' : 'red'}>
                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Link href={`/admin/users/${user.id}`} className="text-geely-blue hover:text-navy">
                        Edit
                      </Link>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </table>
        </div>
      </TableCard>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Registered</span>
            <span className="text-gray-900 font-semibold">{totalUsers} users</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Active</span>
            <span className="text-green-600 font-semibold">{activeUsers} users</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Inactive</span>
            <span className="text-red-600 font-semibold">{inactiveUsers} users</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
