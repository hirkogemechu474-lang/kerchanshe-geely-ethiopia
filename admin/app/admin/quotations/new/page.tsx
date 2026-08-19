import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft, FileText, CarFront, DollarSign, User } from 'lucide-react';

export default async function NewQuotationPage() {
  await requirePermission('canManageQuotations');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quotations" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Quotation</h1>
          <p className="mt-1 text-sm text-gray-500">Draft a sales quote and prepare it for approval or sending</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><User className="w-4 h-4" />Customer</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Customer name" />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><CarFront className="w-4 h-4" />Vehicle</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Vehicle model" />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><DollarSign className="w-4 h-4" />Amount</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="ETB amount" />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><FileText className="w-4 h-4" />Template</span>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
              <option>Standard Quote</option>
              <option>Fleet Quote</option>
              <option>Financing Quote</option>
            </select>
          </label>
        </div>

        <label className="space-y-2 text-sm text-gray-700 block">
          <span className="font-medium">Notes</span>
          <textarea className="w-full min-h-32 rounded-lg border border-gray-300 px-3 py-2" placeholder="Add discount notes, trade-in details, or approval remarks..." />
        </label>

        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save Draft
          </button>
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors">
            Save and Send
          </button>
          <Link href="/admin/quotations" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
