import { requirePermission } from '@/lib/auth/middleware';
import { Plus } from 'lucide-react';
import { PageHeader, LinkButton } from '@/components/admin/ui';
import HeroSectionList from '@/components/admin/hero/HeroSectionList';

export default async function HeroManagementPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hero Sections"
        description="Manage homepage hero banners and carousels"
        actions={
          <LinkButton href="/admin/content/hero/new">
            <Plus className="w-5 h-5" />
            Add Hero Section
          </LinkButton>
        }
      />

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
