import { requirePermission } from '@/lib/auth/middleware';
import PurchasesList from '@/components/admin/PurchasesList';

export default async function AdminPurchasesPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Purchases</h1>
        <p className="mt-1 text-sm text-gray-500">Review direct vehicle purchases and bank payment confirmations.</p>
      </div>
      <PurchasesList />
    </div>
  );
}
