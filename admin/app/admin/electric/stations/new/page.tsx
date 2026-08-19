import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ChargingStationForm from '@/components/admin/electric/ChargingStationForm';

export default async function NewChargingStationPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <Link
        href="/admin/electric/stations"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-900"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Stations
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Charging Station</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new charging station to your network
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ChargingStationForm />
      </div>
    </div>
  );
}
