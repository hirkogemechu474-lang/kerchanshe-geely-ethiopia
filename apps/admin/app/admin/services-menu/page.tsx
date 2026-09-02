import { requirePermission } from '@/lib/auth/middleware';
import { Plus, Menu, FileText } from 'lucide-react';
import { PageHeader, LinkButton } from '@/components/admin/ui';
import ServicesMenuList from '@/components/admin/services/ServicesMenuList';

export default async function ServicesMenuPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services Menu"
        description="Manage the Services dropdown menu that appears on your website"
        actions={
          <>
            <LinkButton href="/admin/services-menu/sections/new">
              <Plus className="w-4 h-4" />
              Add Section
            </LinkButton>
            <LinkButton href="/admin/services-menu/items/new" variant="secondary">
              <Menu className="w-4 h-4" />
              Add Menu Item
            </LinkButton>
            <LinkButton href="/admin/services-menu/pages" variant="secondary">
              <FileText className="w-4 h-4" />
              Manage Pages
            </LinkButton>
          </>
        }
      />

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
