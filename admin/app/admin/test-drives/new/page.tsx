import { requirePermission } from '@/lib/auth/middleware';
import { ArrowLeft } from 'lucide-react';
import TestDriveForm from '@/components/admin/test-drives/TestDriveForm';
import { PageHeader, LinkButton } from '@/components/admin/ui';

export default async function NewTestDrivePage() {
  await requirePermission('canManageTestDrives');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <LinkButton href="/admin/test-drives" variant="ghost" size="sm" className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </LinkButton>
        <PageHeader
          title="Schedule Test Drive"
          description="Book a new test drive appointment for a customer"
        />
      </div>

      {/* Form */}
      <TestDriveForm mode="create" />
    </div>
  );
}
