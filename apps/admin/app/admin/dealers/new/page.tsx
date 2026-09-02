import { requirePermission } from '@/lib/auth/middleware';
import DealerForm from '@/components/admin/dealers/DealerForm';

export default async function NewDealerPage() {
  await requirePermission('canManageDealers');

  return <DealerForm />;
}
