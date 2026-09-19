'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { FinancingPageContentEditor } from '@/components/admin/financing/FinancingPageContentEditor';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function FinancingPageContentRoute() {
  useAdminAuth('canManageSettings');
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/financing" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Vehicle Purchases &amp; Payments
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-navy text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Public Financing Page Content</h1>
            <p className="text-gray-600">Edit the copy and sections shown on the public /financing page</p>
          </div>
        </div>
      </div>
      <FinancingPageContentEditor />
    </div>
  );
}
