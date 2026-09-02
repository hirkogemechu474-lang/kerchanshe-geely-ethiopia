import { requirePermission } from '@/lib/auth/middleware';
import ReviewsList from '@/components/admin/ReviewsList';
import { PageHeader } from '@/components/admin/ui';

export default async function AdminReviewsPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Reviews" description="Manage and moderate customer reviews" />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Review Management</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Review submissions are pending moderation by default</li>
          <li>• Approve reviews to display them on the website</li>
          <li>• Mark reviews as featured to highlight them on the homepage</li>
          <li>• Edit or delete inappropriate reviews</li>
          <li>• Homepage displays only approved reviews</li>
        </ul>
      </div>

      <ReviewsList />
    </div>
  );
}
