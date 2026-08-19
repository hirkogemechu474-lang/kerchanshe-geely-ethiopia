import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import QuotationsList from '@/components/admin/QuotationsList';

export default async function AdminQuotationsPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quote Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage customer quotation and inquiry requests
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">📊 Quotation Management</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• All customer quote submissions are displayed here</li>
          <li>• Track quotation status: New → Contacted → In Progress → Converted → Closed</li>
          <li>• Quick contact information (phone, email) for each request</li>
          <li>• View customer details and vehicle interests</li>
          <li>• Add internal notes for team collaboration</li>
          <li>• See statistics on quote conversion rates</li>
        </ul>
      </div>

      <QuotationsList />
    </div>
  );
}
