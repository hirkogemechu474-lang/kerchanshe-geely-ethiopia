import { requirePermission } from '@/lib/auth/middleware';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TestDriveForm from '@/components/admin/test-drives/TestDriveForm';

export default async function NewTestDrivePage() {
  await requirePermission('canManageTestDrives');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/test-drives"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Test Drive</h1>
          <p className="mt-1 text-sm text-gray-500">
            Book a new test drive appointment for a customer
          </p>
        </div>
      </div>

      {/* Form */}
      <TestDriveForm mode="create" />
    </div>
  );
}
