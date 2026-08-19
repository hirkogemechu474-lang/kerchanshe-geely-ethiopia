import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, Users, Shield, Activity, UserX } from 'lucide-react';
import { prisma } from '@/lib/prisma';



export default async function UsersPage() {
  await requirePermission('canManageUsers');

  // Fetch users from database
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
    },
  });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const uniqueRoles = [...new Set(users.map(u => u.role))].length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage admin users and permissions</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add User
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{totalUsers}</h3>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Activity className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{activeUsers}</h3>
          <p className="text-sm text-gray-500">Active Users</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Shield className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{uniqueRoles}</h3>
          <p className="text-sm text-gray-500">Roles</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <UserX className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{inactiveUsers}</h3>
          <p className="text-sm text-gray-500">Inactive</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No users found</p>
                  <Link href="/admin/users/new" className="text-blue-600 hover:underline mt-2 inline-block">
                    Create your first user
                  </Link>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:text-blue-700 mr-3">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
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
      </div>
    </div>
  );
}
