import { requirePermission } from '@/lib/auth/middleware';
import PromotionsList from '@/components/admin/PromotionsList';
import { PageHeader } from '@/components/admin/ui';

export default async function AdminPromotionsPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <PageHeader title="Promotions" description="Create and manage promotional campaigns" />

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-2">⚡ Promotion Management</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Create time-limited promotions with start and end dates</li>
          <li>• Upload banner images and videos</li>
          <li>• Mark promotions as featured to display prominently</li>
          <li>• Automatically hide expired promotions</li>
          <li>• Featured promotions display on the homepage</li>
          <li>• Active promotions automatically appear when dates match</li>
        </ul>
      </div>

      <PromotionsList />
    </div>
  );
}
