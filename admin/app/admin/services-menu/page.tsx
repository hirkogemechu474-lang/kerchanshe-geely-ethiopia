import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, Menu, FileText } from 'lucide-react';
import ServicesMenuList from '@/components/admin/services/ServicesMenuList';

export default async function ServicesMenuPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Menu</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the Services dropdown menu that appears on your website
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/services-menu/sections/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Section
          </Link>
          <Link
            href="/admin/services-menu/items/new"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
            Add Menu Item
          </Link>
          <Link
            href="/admin/services-menu/pages"
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Manage Pages
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 How Services Menu Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Sections</strong> are the main categories (e.g., Sales, Service & Parts)</li>
          <li>• <strong>Menu Items</strong> are the individual services under each section (e.g., Test Drive, Service Booking)</li>
          <li>• <strong>Pages</strong> are the actual content pages customers see when they click a menu item</li>
          <li>• Only <strong>active</strong> sections and items with <strong>published</strong> pages appear on the website</li>
          <li>• Drag items to reorder them (coming soon)</li>
        </ul>
      </div>

      <ServicesMenuList />
    </div>
  );
}
