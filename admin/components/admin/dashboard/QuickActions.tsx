'use client';

import Link from 'next/link';
import { AdminRole, AdminPermissions } from '@/lib/auth/types';
import {
  Plus,
  Calendar,
  FileText,
  MessageSquare,
  Package,
  Megaphone,
  Users,
  Settings,
  Shield,
  Share2,
  Cookie,
  Globe,
} from 'lucide-react';

interface QuickAction {
  name: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  permission?: keyof AdminPermissions;
}

const quickActions: QuickAction[] = [
  {
    name: 'Add Vehicle',
    description: 'Add new vehicle to inventory',
    href: '/admin/vehicles/new',
    icon: Plus,
    color: 'bg-blue-500 hover:bg-blue-600',
    permission: 'canManageVehicles',
  },
  {
    name: 'Edit Policies',
    description: 'Privacy, Terms & Cookies',
    href: '/admin/settings/policies',
    icon: Shield,
    color: 'bg-green-500 hover:bg-green-600',
    permission: 'canManageSettings',
  },
  {
    name: 'All Pages',
    description: 'Manage all dynamic content pages',
    href: '/admin/pages',
    icon: Globe,
    color: 'bg-teal-500 hover:bg-teal-600',
    permission: 'canManageContent',
  },
  {
    name: 'Cookie Consent',
    description: 'Manage cookie banner settings',
    href: '/admin/settings/cookie-banner',
    icon: Cookie,
    color: 'bg-orange-500 hover:bg-orange-600',
    permission: 'canManageSettings',
  },
  {
    name: 'Social Media',
    description: 'Update social media links',
    href: '/admin/settings/social-media',
    icon: Share2,
    color: 'bg-purple-500 hover:bg-purple-600',
    permission: 'canManageSettings',
  },
  {
    name: 'Schedule Test Drive',
    description: 'Book test drive for customer',
    href: '/admin/test-drives/new',
    icon: Calendar,
    color: 'bg-orange-500 hover:bg-orange-600',
    permission: 'canManageTestDrives',
  },
  {
    name: 'Create Quotation',
    description: 'Generate price quote',
    href: '/admin/quotations/new',
    icon: FileText,
    color: 'bg-pink-500 hover:bg-pink-600',
    permission: 'canManageQuotations',
  },
  {
    name: 'Reply to Messages',
    description: 'Respond to customer inquiries',
    href: '/admin/messages',
    icon: MessageSquare,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    permission: 'canViewMessages',
  },
  {
    name: 'Add Spare Part',
    description: 'Register new spare part',
    href: '/admin/spare-parts/new',
    icon: Package,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    permission: 'canManageSpareParts',
  },
  {
    name: 'Create Campaign',
    description: 'Launch new promotion',
    href: '/admin/promotions/new',
    icon: Megaphone,
    color: 'bg-red-500 hover:bg-red-600',
    permission: 'canManagePromotions',
  },
  {
    name: 'Add User',
    description: 'Create admin user account',
    href: '/admin/users/new',
    icon: Users,
    color: 'bg-teal-500 hover:bg-teal-600',
    permission: 'canManageUsers',
  },
  {
    name: 'System Settings',
    description: 'Configure platform settings',
    href: '/admin/settings',
    icon: Settings,
    color: 'bg-gray-500 hover:bg-gray-600',
    permission: 'canViewSettings',
  },
];

interface QuickActionsProps {
  userRole: AdminRole;
  permissions: AdminPermissions;
}

export default function QuickActions({ userRole, permissions }: QuickActionsProps) {
  const filteredActions = quickActions.filter((action) => {
    if (!action.permission) return true;
    return permissions[action.permission];
  });

  // Show max 6 quick actions
  const displayActions = filteredActions.slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center transition-colors`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                  {action.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
