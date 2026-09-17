import { requirePermission } from '@/lib/auth/middleware';
import { ArrowLeft } from 'lucide-react';
import WalkInForm from '@/components/admin/walk-ins/WalkInForm';
import { PageHeader, LinkButton } from '@/components/admin/ui';

export default async function NewWalkInPage() {
  await requirePermission('canManageTestDrives');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <LinkButton href="/admin/walk-ins" variant="ghost" size="sm" className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </LinkButton>
        <PageHeader
          title="Register Walk-in Customer"
          description="Save the details of a visitor who doesn't have a smartphone"
        />
      </div>
      <WalkInForm />
    </div>
  );
}
