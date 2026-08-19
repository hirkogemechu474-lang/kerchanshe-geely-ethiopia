'use client';

import { useRouter } from 'next/navigation';
import { Battery, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BatteryForm from '@/components/admin/electric/BatteryForm';

export default function BatteryPageEditor() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/electric"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Battery className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Battery & Warranty Page</h1>
                <p className="text-gray-600 mt-1">
                  Manage the battery technology and warranty information page
                </p>
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/electric/battery"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
        >
          <Eye className="w-4 h-4" />
          Preview
        </Link>
      </div>

      <BatteryForm onSave={() => router.refresh()} />
    </div>
  );
}