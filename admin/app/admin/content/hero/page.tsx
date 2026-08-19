import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import HeroSectionList from '@/components/admin/hero/HeroSectionList';

export default async function HeroManagementPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Sections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage homepage hero banners and carousels
          </p>
        </div>
        <Link
          href="/admin/content/hero/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Hero Section
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 How Hero Sections Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Only <strong>active</strong> hero sections appear on the homepage</li>
          <li>• Multiple active sections rotate automatically every 7 seconds</li>
          <li>• Use <strong>Sort Order</strong> to control display sequence</li>
          <li>• Upload images (recommended: 1920x560px) or videos (MP4)</li>
          <li>• Add a poster image for videos to improve loading experience</li>
        </ul>
      </div>

      <HeroSectionList />
    </div>
  );
}
