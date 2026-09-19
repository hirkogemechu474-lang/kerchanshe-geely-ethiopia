import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, HelpCircle } from 'lucide-react';
import FAQList from '@/components/admin/faq/FAQList';
import { requirePermission } from '@/lib/auth/middleware';

export const metadata: Metadata = {
  title: 'FAQ Management - Admin',
  description: 'Manage frequently asked questions',
};

export default async function FAQManagementPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage frequently asked questions displayed on your website
          </p>
        </div>
        <Link
          href="/admin/faq/new"
          className="flex items-center gap-2 bg-geely-blue text-white px-4 py-2 rounded-lg hover:bg-navy transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add FAQ
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">❓ How FAQs Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Featured FAQs</strong> appear prominently on the homepage</li>
          <li>• <strong>Categories</strong> help organize FAQs by topic (Warranty, Service, etc.)</li>
          <li>• <strong>Display Order</strong> controls the sequence (0 = first, 1 = second, etc.)</li>
          <li>• Only <strong>Active</strong> FAQs are visible to website visitors</li>
          <li>• You can use basic HTML in answers for formatting</li>
        </ul>
      </div>

      {/* FAQ List */}
      <FAQList />
    </div>
  );
}