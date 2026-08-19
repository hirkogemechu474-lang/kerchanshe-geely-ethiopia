import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import ReviewsList from '@/components/admin/ReviewsList';

export default async function AdminReviewsPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and moderate customer reviews
        </p>
      </div>

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
