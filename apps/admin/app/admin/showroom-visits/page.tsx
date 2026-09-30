import { requireAnyPermission } from '@/lib/auth/middleware';
import ShowroomVisitsList from '@/components/admin/showroom-visits/ShowroomVisitsList';

export default async function AdminShowroomVisitsPage() {
  await requireAnyPermission(['canViewQuotations', 'canManageShowroomVisits']);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Showroom Visits</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every visitor who scanned the showroom QR code — what they registered, and what it led to.
        </p>
      </div>

      <ShowroomVisitsList />
    </div>
  );
}
