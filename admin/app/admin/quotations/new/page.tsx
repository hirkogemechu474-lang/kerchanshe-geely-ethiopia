import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import WalkInLeadForm from '@/components/admin/sales/WalkInLeadForm';

export default async function NewQuotationPage() {
  await requirePermission('canManageQuotations');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quotations" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Log a Lead</h1>
          <p className="mt-1 text-sm text-gray-500">Capture a walk-in or phone enquiry with a source tag</p>
        </div>
      </div>

      <WalkInLeadForm />
    </div>
  );
}
